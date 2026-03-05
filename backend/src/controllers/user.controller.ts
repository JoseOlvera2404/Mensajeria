import { Request, Response } from "express";
import pool from "../config/db.js";
import { AuthRequest } from "../middlewares/auth.middleware.js";
import { uploadImage } from "../services/cloudinary.service.js";


// =============================
// GET /users/me
// =============================
export const getMe = async (req: AuthRequest, res: Response) => {

  try {

    const userId = req.userId;

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


// =============================
// GET /users/:id
// =============================
export const getUserById = async (req: AuthRequest, res: Response) => {

  try {

    const { id } = req.params;

    const result = await pool.query(
      `SELECT id, public_code, name, profile_picture_url
       FROM mensajeria.users
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    return res.json(result.rows[0]);

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      message: "Error interno del servidor"
    });
  }
};


// =============================
// GET /users/search?q=juan
// =============================
export const searchUsers = async (req: AuthRequest, res: Response) => {

  try {

    const { q } = req.query;

    if (!q || typeof q !== "string") {
      return res.status(400).json({
        message: "Query inválida"
      });
    }

    const result = await pool.query(
      `SELECT id, public_code, name, profile_picture_url
       FROM mensajeria.users
       WHERE name ILIKE '%' || $1 || '%'
       LIMIT 20`,
      [q]
    );

    return res.json(result.rows);

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      message: "Error interno del servidor"
    });
  }
};


// =============================
// PATCH /users/profile
// =============================
export const updateProfile = async (req: AuthRequest, res: Response) => {

  try {

    const userId = req.userId;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "Nombre requerido"
      });
    }

    const result = await pool.query(
      `UPDATE mensajeria.users
       SET name = $1
       WHERE id = $2
       RETURNING id, public_code, name, email, profile_picture_url`,
      [name, userId]
    );

    return res.json({
      message: "Perfil actualizado",
      user: result.rows[0]
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      message: "Error interno del servidor"
    });
  }
};


// =============================
// PATCH /users/profile-picture
// =============================
export const updateProfilePicture = async (req: AuthRequest, res: Response) => {

  try {

    const userId = req.userId;

    if (!req.file) {
      return res.status(400).json({
        message: "Imagen requerida"
      });
    }

    const upload = await uploadImage(req.file.buffer);

    await pool.query(
      `UPDATE mensajeria.users
       SET profile_picture_url = $1,
           profile_picture_public_id = $2
       WHERE id = $3`,
      [upload.secure_url, upload.public_id, userId]
    );

    return res.json({
      message: "Foto de perfil actualizada",
      url: upload.secure_url
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      message: "Error interno del servidor"
    });
  }
};