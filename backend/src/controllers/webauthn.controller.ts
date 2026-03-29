import { Request, Response } from "express";
import pool from "../config/db.js";
import crypto from "crypto";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse
} from "@simplewebauthn/server";

import jwt from "jsonwebtoken";

const rpID = process.env.RP_ID!;
const origin = process.env.ORIGIN!;

// 🔥 almacenamiento temporal
const challenges: Record<string, string> = {};

// ==========================
// REGISTER OPTIONS
// ==========================
export const registerOptions = async (req: Request, res: Response) => {
  try {

    const userId = req.userId; // usa tu middleware auth

    if (!userId) {
      return res.status(401).json({ message: "No autorizado" });
    }

    const options = await generateRegistrationOptions({
      rpName: process.env.RP_NAME!,
      rpID,
      userID: new TextEncoder().encode(userId),
      userName: userId,
      userDisplayName: userId,
      timeout: 60000,
      attestationType: "none",
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "preferred"
      }
    });

    challenges[userId] = options.challenge;

    return res.json(options);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error generating options" });
  }
};

// ==========================
// REGISTER VERIFY
// ==========================
export const registerVerify = async (req: Request, res: Response) => {
  try {

    const userId = req.userId;

    const expectedChallenge = challenges[userId!];

    const verification = await verifyRegistrationResponse({
      response: req.body.credential,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID
    });

    if (!verification.verified) {
      return res.status(400).json({ message: "No verificado" });
    }

    const { credential } = verification.registrationInfo!;

    const credentialID = credential.id;
    const credentialPublicKey = credential.publicKey;
    const counter = credential.counter;

    await pool.query(
      `INSERT INTO mensajeria.web_credentials
       (user_id, credential_id, public_key, counter)
       VALUES ($1,$2,$3,$4)`,
      [
        userId,
        credentialID,
        credentialPublicKey,
        counter
      ]
    );

    return res.json({ message: "Registrado" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error verify" });
  }
};

// ==========================
// LOGIN OPTIONS
// ==========================
export const loginOptions = async (req: Request, res: Response) => {
  try {

    const { email } = req.body;

    const user = await pool.query(
      `SELECT id FROM mensajeria.users WHERE email=$1`,
      [email]
    );

    if (user.rows.length === 0) {
      return res.status(400).json({ message: "Usuario no encontrado" });
    }

    const userId = user.rows[0].id;

    const creds = await pool.query(
      `SELECT credential_id FROM mensajeria.web_credentials
       WHERE user_id=$1`,
      [userId]
    );

    const allowCredentials = creds.rows.map((c: any) => ({
      id: c.credential_id, // 🔥 STRING DIRECTO
      type: "public-key"
    }));

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials,
      userVerification: "preferred"
    });

    challenges[userId] = options.challenge;

    return res.json(options);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error options login" });
  }
};

// ==========================
// LOGIN VERIFY
// ==========================
export const loginVerify = async (req: Request, res: Response) => {
  try {

    const { email, credential } = req.body;

    const user = await pool.query(
      `SELECT id FROM mensajeria.users WHERE email=$1`,
      [email]
    );

    if (user.rows.length === 0) {
      return res.status(400).json({ message: "Usuario no encontrado" });
    }

    const userId = user.rows[0].id;

    const cred = await pool.query(
      `SELECT * FROM mensajeria.web_credentials
       WHERE user_id=$1`,
      [userId]
    );

    if (cred.rows.length === 0) {
      return res.status(400).json({ message: "Sin credenciales" });
    }

    const dbCred = cred.rows[0];

    const verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge: challenges[userId],
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: dbCred.credential_id,
        publicKey: dbCred.public_key,
        counter: dbCred.counter
      }
    });

    if (!verification.verified) {
      return res.status(401).json({ message: "No válido" });
    }

    // actualizar contador
    await pool.query(
      `UPDATE mensajeria.web_credentials
       SET counter=$1
       WHERE user_id=$2`,
      [verification.authenticationInfo.newCounter, userId]
    );

    const token = jwt.sign(
      { userId },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    return res.json({
      message: "Login exitoso",
      token
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error login" });
  }
};