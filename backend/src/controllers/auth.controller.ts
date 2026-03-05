import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import crypto from "crypto";


// REGISTRO
export const register = async (req: Request, res: Response) => {
  try {

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Faltan datos obligatorios" });
    }

    const existingUser = await pool.query(
      "SELECT id FROM mensajeria.users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: "El correo ya está registrado" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO mensajeria.users 
       (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, public_code, name, email`,
      [name, email, hashedPassword]
    );

    return res.status(201).json({
      message: "Usuario creado correctamente",
      user: result.rows[0],
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error interno del servidor" });
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

    if (!userId) {
      return res.status(401).json({ message: "Token inválido" });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Faltan datos" });
    }

    const result = await pool.query(
      `SELECT password_hash
       FROM mensajeria.users
       WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const user = result.rows[0];

    const validPassword = await bcrypt.compare(
      currentPassword,
      user.password_hash
    );

    if (!validPassword) {
      return res.status(400).json({ message: "Contraseña incorrecta" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
      `UPDATE mensajeria.users
       SET password_hash = $1
       WHERE id = $2`,
      [hashedPassword, userId]
    );

    return res.json({ message: "Contraseña actualizada" });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error interno del servidor" });
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