import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import crypto from "crypto";
import { sendVerificationCode } from "../services/email.service.js";

const generateCode = () => {
  return crypto.randomInt(100000,999999).toString();
};

// REGISTRO
export const register = async (req: Request, res: Response) => {

  try {

    const { name, email, password, code } = req.body;

    if(!name || !email || !password || !code){
      return res.status(400).json({
        message:"Faltan datos"
      });
    }

    const codeResult = await pool.query(
      `SELECT *
       FROM mensajeria.email_codes
       WHERE email=$1
       AND code=$2
       AND used=false
       AND expires_at > NOW()
       ORDER BY expires_at DESC
       LIMIT 1`,
      [email, code]
    );

    if(codeResult.rows.length === 0){
      return res.status(400).json({
        message:"Código inválido"
      });
    }

    const hashedPassword = await bcrypt.hash(password,10);

    const result = await pool.query(
      `INSERT INTO mensajeria.users
       (name,email,password_hash)
       VALUES ($1,$2,$3)
       RETURNING id,public_code,name,email`,
      [name,email,hashedPassword]
    );

    const user = result.rows[0];

    await pool.query(
      `UPDATE mensajeria.email_codes
       SET used=true
       WHERE id=$1`,
      [codeResult.rows[0].id]
    );

    // =============================
    // CREAR CONVERSACIÓN CON BOT
    // =============================

    const botId = process.env.CHATBOT_USER_ID;

    const conversation = await pool.query(
      `
      INSERT INTO mensajeria.conversations
      (type,name,created_by)
      VALUES('private','Asistente',$1)
      RETURNING id
      `,
      [user.id]
    );

    const conversationId = conversation.rows[0].id;

    await pool.query(
      `
      INSERT INTO mensajeria.conversation_members
      (conversation_id,user_id)
      VALUES
      ($1,$2),
      ($1,$3)
      `,
      [
        conversationId,
        user.id,
        botId
      ]
    );

    // =============================

    return res.status(201).json({
      message:"Usuario creado",
      user
    });

  } catch(error){

    console.error(error);

    return res.status(500).json({
      message:"Error interno"
    });

  }

};

export const requestRegisterCode = async (req: Request, res: Response) => {

  try {

    const { email } = req.body;

    const code = generateCode();

    const expires = new Date(Date.now() + 10 * 60 * 1000);

    await pool.query(
      `INSERT INTO mensajeria.email_codes
       (email, code, expires_at)
       VALUES ($1,$2,$3)`,
      [email, code, expires]
    );

    await sendVerificationCode(email, code);

    return res.json({
      message: "Código enviado"
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      message: "Error enviando código"
    });

  }

};


// LOGIN
export const login = async (req: Request, res: Response) => {
  try {

    const { email, password } = req.body;

    const result = await pool.query(
      `SELECT id, password_hash, is_active
       FROM mensajeria.users
       WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Credenciales inválidas" });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(403).json({ message: "Cuenta desactivada" });
    }

    const validPassword = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!validPassword) {
      return res.status(400).json({ message: "Credenciales inválidas" });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    return res.json({
      message: "Login exitoso",
      token,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};


// Obtener ID de usuario desde el token
const getUserIdFromToken = (req: Request): string | null => {

  const authHeader = req.headers.authorization;

  if (!authHeader) return null;

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as any;

    return decoded.userId;

  } catch {
    return null;
  }
};


// ME
export const me = async (req: Request, res: Response) => {
  try {

    const userId = getUserIdFromToken(req);

    if (!userId) {
      return res.status(401).json({ message: "Token inválido" });
    }

    const result = await pool.query(
      `SELECT id, public_code, name, email, profile_picture_url
       FROM mensajeria.users
       WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    return res.json(result.rows[0]);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};


// CHANGE PASSWORD
export const changePassword = async (req: Request, res: Response) => {

  try {

    const userId = getUserIdFromToken(req);

    const { newPassword, code } = req.body;

    const user = await pool.query(
      `SELECT email FROM mensajeria.users WHERE id=$1`,
      [userId]
    );

    if(user.rows.length === 0){
      return res.status(404).json({
        message:"Usuario no encontrado"
      });
    }

    const email = user.rows[0].email;

    const codeResult = await pool.query(
      `SELECT *
       FROM mensajeria.email_codes
       WHERE email=$1
       AND code=$2
       AND used=false
       AND expires_at > NOW()
       LIMIT 1`,
      [email,code]
    );

    if(codeResult.rows.length === 0){
      return res.status(400).json({
        message:"Código inválido"
      });
    }

    const hashed = await bcrypt.hash(newPassword,10);

    await pool.query(
      `UPDATE mensajeria.users
       SET password_hash=$1
       WHERE id=$2`,
      [hashed,userId]
    );

    await pool.query(
      `UPDATE mensajeria.email_codes
       SET used=true
       WHERE id=$1`,
      [codeResult.rows[0].id]
    );

    return res.json({
      message:"Contraseña actualizada"
    });

  } catch(error){

    console.error(error);

    return res.status(500).json({
      message:"Error interno"
    });

  }

};


// REQUEST PASSWORD RESET
export const requestPasswordReset = async (req: Request, res: Response) => {
  try {

    const { email } = req.body;

    const userResult = await pool.query(
      `SELECT id FROM mensajeria.users WHERE email = $1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.json({
        message: "Si el correo existe, se enviará un enlace"
      });
    }

    const userId = userResult.rows[0].id;

    const token = crypto.randomBytes(32).toString("hex");

    const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

    await pool.query(
      `INSERT INTO mensajeria.password_resets
       (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [userId, token, expiresAt]
    );

    return res.json({
      message: "Token generado",
      token
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

export const requestPasswordChangeCode = async (req: Request, res: Response) => {

  try {

    const userId = getUserIdFromToken(req);

    const user = await pool.query(
      `SELECT email FROM mensajeria.users WHERE id=$1`,
      [userId]
    );

    const email = user.rows[0].email;

    const code = generateCode();

    const expires = new Date(Date.now() + 10 * 60 * 1000);

    await pool.query(
      `INSERT INTO mensajeria.email_codes
       (email,code,expires_at)
       VALUES ($1,$2,$3)`,
      [email,code,expires]
    );

    await sendVerificationCode(email,code);

    return res.json({
      message:"Código enviado"
    });

  } catch(error){

    console.error(error);

    return res.status(500).json({
      message:"Error enviando código"
    });

  }

};

// CONFIRM PASSWORD RESET
export const confirmPasswordReset = async (req: Request, res: Response) => {
  try {

    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: "Faltan datos" });
    }

    const result = await pool.query(
      `SELECT *
       FROM mensajeria.password_resets
       WHERE token = $1
       AND used = false
       AND expires_at > NOW()`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Token inválido o expirado" });
    }

    const reset = result.rows[0];

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
      `UPDATE mensajeria.users
       SET password_hash = $1
       WHERE id = $2`,
      [hashedPassword, reset.user_id]
    );

    await pool.query(
      `UPDATE mensajeria.password_resets
       SET used = true
       WHERE id = $1`,
      [reset.id]
    );

    return res.json({
      message: "Contraseña actualizada correctamente"
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

export const generateBiometricChallenge = async (req: Request, res: Response) => {
  try {

    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        message: "Email requerido"
      });
    }

    // 1. Buscar usuario
    const userResult = await pool.query(
      `SELECT id FROM mensajeria.users WHERE email=$1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({
        message: "Usuario no encontrado"
      });
    }

    const userId = userResult.rows[0].id;

    // 2. Generar challenge
    const challenge = crypto.randomBytes(32).toString("hex");

    // 3. Guardarlo temporalmente
    (global as any).biometricChallenges =
      (global as any).biometricChallenges || {};

    (global as any).biometricChallenges[userId] = challenge;

    return res.json({ challenge });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      message: "Error generando challenge"
    });

  }
};

export const registerBiometric = async (req: Request, res: Response) => {

  try {

    const userId = getUserIdFromToken(req);

    if (!userId) {
      return res.status(401).json({ message: "Token inválido" });
    }

    const { publicKey, credentialId } = req.body;

    if (!publicKey || !credentialId) {
      return res.status(400).json({
        message: "Faltan datos"
      });
    }

    await pool.query(
      `INSERT INTO mensajeria.webauthn_credentials
       (user_id, public_key, credential_id)
       VALUES ($1,$2,$3)
       ON CONFLICT (credential_id) DO NOTHING`,
      [userId, publicKey, credentialId]
    );

    return res.json({
      message: "Biometría registrada correctamente"
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      message: "Error registrando biometría"
    });

  }

};

export const biometricLogin = async (req: Request, res: Response) => {

  try {

    const { email, signature, credentialId } = req.body;

    if (!email || !signature || !credentialId) {
      return res.status(400).json({
        message: "Faltan datos"
      });
    }

    // 1. Usuario
    const userResult = await pool.query(
      `SELECT id, is_active FROM mensajeria.users WHERE email=$1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: "Usuario no encontrado" });
    }

    const user = userResult.rows[0];

    if (!user.is_active) {
      return res.status(403).json({ message: "Cuenta desactivada" });
    }

    // 2. Credencial
    const credResult = await pool.query(
      `SELECT public_key
       FROM mensajeria.webauthn_credentials
       WHERE user_id=$1 AND credential_id=$2`,
      [user.id, credentialId]
    );

    if (credResult.rows.length === 0) {
      return res.status(401).json({ message: "Credencial no válida" });
    }

    const rawKey = credResult.rows[0].public_key;

    // 🔥 LIMPIAR DATOS
    const cleanKey = rawKey.replace(/\s+/g, "");
    const cleanSignature = signature.replace(/\s+/g, "");

    // 🔥 CLAVE PUBLICA DESDE DER (CORRECTO PARA ANDROID)
    const publicKey = crypto.createPublicKey({
      key: Buffer.from(cleanKey, "base64"),
      format: "der",
      type: "spki"
    });

    // 3. Challenge
    const challenge = (global as any).biometricChallenges?.[user.id];

    if (!challenge) {
      return res.status(400).json({ message: "Challenge no encontrado" });
    }

    // 🔥 VERIFY CORRECTO
    const isValid = crypto.verify(
      "RSA-SHA256",
      Buffer.from(challenge, "utf-8"),
      publicKey,
      Buffer.from(cleanSignature, "base64")
    );

    if (!isValid) {
      return res.status(401).json({ message: "Biometría inválida" });
    }

    // 4. Token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    return res.json({
      message: "Login biométrico exitoso",
      token
    });

  } catch (error) {

    console.error("ERROR BIOMETRICO:", error);

    return res.status(500).json({
      message: "Error en login biométrico"
    });

  }

};