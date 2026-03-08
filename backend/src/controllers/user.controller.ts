import { Response } from "express";
import pool from "../config/db.js";
import { AuthRequest } from "../middlewares/auth.middleware.js";
import { uploadImage, deleteImage } from "../services/cloudinary.service.js";
import { isUserOnline } from "../services/presence.service.js";


// =============================
// GET /users/me
// =============================
export const getMe = async (req: AuthRequest, res: Response) => {

  try {

    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: "No autorizado" });
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

    return res.status(500).json({
      message: "Error interno del servidor"
    });
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

    const user = result.rows[0];

    const online = isUserOnline(user.id);

    return res.json({
      ...user,
      is_online: online,
      last_seen: online ? null : null
    });

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
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        message: "No autorizado"
      });
    }

    if (!q || typeof q !== "string") {
      return res.status(400).json({
        message: "Query inválida"
      });
    }

    const result = await pool.query(
      `SELECT id, public_code, name, profile_picture_url
       FROM mensajeria.users
       WHERE name ILIKE '%' || $1 || '%'
       AND id <> $2
       LIMIT 20`,
      [q, userId]
    );

    const users = result.rows.map((user) => ({
      ...user,
      is_online: isUserOnline(user.id)
    }));

    return res.json(users);

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

    if (!userId) {
      return res.status(401).json({ message: "No autorizado" });
    }

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

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

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

    if (!userId) {
      return res.status(401).json({ message: "No autorizado" });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "Imagen requerida"
      });
    }

    // Obtener imagen anterior
    const current = await pool.query(
      `SELECT profile_picture_public_id
       FROM mensajeria.users
       WHERE id = $1`,
      [userId]
    );

    if (current.rows.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const oldPublicId = current.rows[0].profile_picture_public_id;

    // Subir nueva imagen
    const upload = await uploadImage(req.file.buffer);

    // Borrar anterior en cloudinary
    if (oldPublicId) {
      await deleteImage(oldPublicId);
    }

    // Actualizar base de datos
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