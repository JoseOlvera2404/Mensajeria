import { Response } from "express";
import pool from "../config/db.js";
import { AuthRequest } from "../middlewares/auth.middleware.js";


// =============================
// POST /friends/request
// =============================
export const sendFriendRequest = async (req: AuthRequest, res: Response) => {

  try {

    const requesterId = req.userId;
    const { userId } = req.body;

    if (!requesterId) {
      return res.status(401).json({ message: "No autorizado" });
    }

    if (!userId) {
      return res.status(400).json({ message: "userId requerido" });
    }

    if (requesterId === userId) {
      return res.status(400).json({ message: "No puedes agregarte a ti mismo" });
    }

    // verificar si ya existe relación entre ambos
    const existing = await pool.query(
      `SELECT id, status
       FROM mensajeria.friendships
       WHERE 
       (requester_id=$1 AND addressee_id=$2)
       OR
       (requester_id=$2 AND addressee_id=$1)`,
      [requesterId, userId]
    );

    if (existing.rows.length > 0) {

      const status = existing.rows[0].status;

      if (status === "accepted") {
        return res.status(400).json({
          message: "Ya son amigos"
        });
      }

      if (status === "pending") {
        return res.status(400).json({
          message: "Ya existe una solicitud pendiente"
        });
      }

      if (status === "blocked") {
        return res.status(400).json({
          message: "No puedes enviar solicitud a este usuario"
        });
      }

    }

    const result = await pool.query(
      `INSERT INTO mensajeria.friendships
       (requester_id, addressee_id)
       VALUES ($1,$2)
       RETURNING id,status`,
      [requesterId, userId]
    );

    return res.json({
      message: "Solicitud enviada",
      friendship: result.rows[0]
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      message: "Error interno del servidor"
    });

  }

};


// =============================
// POST /friends/accept
// =============================
export const acceptFriendRequest = async (req: AuthRequest, res: Response) => {

  try {

    const userId = req.userId;
    const { requestId } = req.body;

    const result = await pool.query(
      `UPDATE mensajeria.friendships
       SET status='accepted'
       WHERE id=$1
       AND addressee_id=$2
       AND status='pending'
       RETURNING id`,
      [requestId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Solicitud no encontrada"
      });
    }

    return res.json({
      message: "Solicitud aceptada"
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      message: "Error interno del servidor"
    });

  }

};


// =============================
// POST /friends/block
// =============================
export const blockUser = async (req: AuthRequest, res: Response) => {

  try {

    const userId = req.userId;
    const { userIdToBlock } = req.body;

    if (!userIdToBlock) {
      return res.status(400).json({
        message: "userId requerido"
      });
    }

    if (userId === userIdToBlock) {
      return res.status(400).json({
        message: "No puedes bloquearte a ti mismo"
      });
    }

    // eliminar relación existente
    await pool.query(
      `DELETE FROM mensajeria.friendships
       WHERE
       (requester_id=$1 AND addressee_id=$2)
       OR
       (requester_id=$2 AND addressee_id=$1)`,
      [userId, userIdToBlock]
    );

    // crear relación bloqueada
    await pool.query(
      `INSERT INTO mensajeria.friendships
       (requester_id, addressee_id, status)
       VALUES ($1,$2,'blocked')`,
      [userId, userIdToBlock]
    );

    return res.json({
      message: "Usuario bloqueado"
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      message: "Error interno del servidor"
    });

  }

};


// =============================
// GET /friends
// =============================
export const getFriends = async (req: AuthRequest, res: Response) => {

  try {

    const userId = req.userId;

    const result = await pool.query(
      `SELECT
        u.id,
        u.public_code,
        u.name,
        u.profile_picture_url
       FROM mensajeria.friendships f
       JOIN mensajeria.users u
       ON (
            u.id = f.requester_id
            OR u.id = f.addressee_id
          )
       WHERE f.status='accepted'
       AND (f.requester_id=$1 OR f.addressee_id=$1)
       AND u.id <> $1`,
      [userId]
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
// GET /friends/requests
// =============================
export const getFriendRequests = async (req: AuthRequest, res: Response) => {

  try {

    const userId = req.userId;

    const result = await pool.query(
      `SELECT
        f.id,
        u.id as user_id,
        u.name,
        u.profile_picture_url
       FROM mensajeria.friendships f
       JOIN mensajeria.users u
       ON u.id = f.requester_id
       WHERE f.addressee_id=$1
       AND f.status='pending'`,
      [userId]
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
// DELETE /friends/:id
// =============================
export const deleteFriend = async (req: AuthRequest, res: Response) => {

  try {

    const userId = req.userId;
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM mensajeria.friendships
       WHERE
       (requester_id=$1 AND addressee_id=$2)
       OR
       (requester_id=$2 AND addressee_id=$1)
       RETURNING id`,
      [userId, id]
    );

    if(result.rows.length === 0){
      return res.status(404).json({
        message:"Amistad no encontrada"
      });
    }

    return res.json({
      message:"Amigo eliminado"
    });

  } catch(error){

    console.error(error);

    return res.status(500).json({
      message:"Error interno del servidor"
    });

  }

};

// =============================
// GET /friends/blocked
// =============================
export const getBlockedUsers = async (req: AuthRequest, res: Response) => {

  try {

    const userId = req.userId;

    const result = await pool.query(
      `SELECT
        u.id,
        u.public_code,
        u.name,
        u.profile_picture_url
       FROM mensajeria.friendships f
       JOIN mensajeria.users u
       ON u.id = f.addressee_id
       WHERE f.requester_id = $1
       AND f.status = 'blocked'`,
      [userId]
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
// POST /friends/unblock
// =============================
export const unblockUser = async (req: AuthRequest, res: Response) => {

  try {

    const userId = req.userId;
    const { userIdToUnblock } = req.body;

    if (!userIdToUnblock) {
      return res.status(400).json({
        message: "userId requerido"
      });
    }

    const result = await pool.query(
      `DELETE FROM mensajeria.friendships
       WHERE requester_id=$1
       AND addressee_id=$2
       AND status='blocked'
       RETURNING id`,
      [userId, userIdToUnblock]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Usuario no estaba bloqueado"
      });
    }

    return res.json({
      message: "Usuario desbloqueado"
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      message: "Error interno del servidor"
    });

  }

};

// =============================
// GET /friends/status/:userId
// =============================
export const getFriendStatus = async (req: AuthRequest, res: Response) => {

  try {

    const requesterId = req.userId;
    const { userId } = req.params;

    if (!requesterId) {
      return res.status(401).json({ message: "No autorizado" });
    }

    if (!userId) {
      return res.status(400).json({ message: "userId requerido" });
    }

    const result = await pool.query(
      `SELECT status
       FROM mensajeria.friendships
       WHERE
       (requester_id=$1 AND addressee_id=$2)
       OR
       (requester_id=$2 AND addressee_id=$1)
       LIMIT 1`,
      [requesterId, userId]
    );

    if (result.rows.length === 0) {

      return res.json({
        status: "none"
      });

    }

    return res.json({
      status: result.rows[0].status
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      message: "Error interno del servidor"
    });

  }

};

// =============================
// POST /friends/reject
// =============================
export const rejectFriendRequest = async (req: AuthRequest, res: Response) => {

  try {

    const userId = req.userId;
    const { requestId } = req.body;

    const result = await pool.query(
      `DELETE FROM mensajeria.friendships
       WHERE id=$1
       AND addressee_id=$2
       AND status='pending'
       RETURNING id`,
      [requestId, userId]
    );

    if(result.rows.length === 0){
      return res.status(404).json({
        message:"Solicitud no encontrada"
      });
    }

    return res.json({
      message:"Solicitud rechazada"
    });

  } catch (error){

    console.error(error);

    return res.status(500).json({
      message:"Error interno del servidor"
    });

  }

};