import { Response } from "express";
import pool from "../config/db.js";
import { AuthRequest } from "../middlewares/auth.middleware.js";


// =============================
// POST /conversations/private
// =============================
export const createPrivateConversation = async (req: AuthRequest, res: Response) => {

  try {

    const userId = req.userId;
    const { userId: otherUserId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId requerido" });
    }

    if (!otherUserId) {
      return res.status(400).json({ message: "userId requerido" });
    }

    if (userId === otherUserId) {
      return res.status(400).json({ message: "No puedes crear chat contigo mismo" });
    }

    const [user1, user2] =
      userId < otherUserId
        ? [userId, otherUserId]
        : [otherUserId, userId];

    const existing = await pool.query(
      `SELECT conversation_id
       FROM mensajeria.private_conversations
       WHERE user1=$1 AND user2=$2`,
      [user1, user2]
    );

    if (existing.rows.length > 0) {
      return res.json({
        conversationId: existing.rows[0].conversation_id,
        existing: true
      });
    }

    const conv = await pool.query(
      `INSERT INTO mensajeria.conversations
       (type, created_by)
       VALUES ('private',$1)
       RETURNING id`,
      [userId]
    );

    const conversationId = conv.rows[0].id;

    await pool.query(
      `INSERT INTO mensajeria.private_conversations
       (conversation_id,user1,user2)
       VALUES ($1,$2,$3)`,
      [conversationId, user1, user2]
    );

    await pool.query(
      `INSERT INTO mensajeria.conversation_members
       (conversation_id,user_id)
       VALUES
       ($1,$2),
       ($1,$3)`,
      [conversationId, userId, otherUserId]
    );

    return res.json({
      message: "Conversación creada",
      conversationId
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      message: "Error interno del servidor"
    });

  }

};


// =============================
// POST /conversations/group
// =============================
export const createGroupConversation = async (req: AuthRequest, res: Response) => {

  try {

    const userId = req.userId;
    const { name, members } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Nombre requerido" });
    }

    if (!members || !Array.isArray(members) || members.length < 2) {
      return res.status(400).json({
        message: "El grupo debe tener al menos 3 miembros"
      });
    }

    const conv = await pool.query(
      `INSERT INTO mensajeria.conversations
       (type,name,created_by)
       VALUES ('group',$1,$2)
       RETURNING id`,
      [name, userId]
    );

    const conversationId = conv.rows[0].id;

    await pool.query(
      `INSERT INTO mensajeria.conversation_members
       (conversation_id,user_id,role)
       VALUES ($1,$2,'admin')`,
      [conversationId, userId]
    );

    for (const memberId of members) {

      await pool.query(
        `INSERT INTO mensajeria.conversation_members
         (conversation_id,user_id)
         VALUES ($1,$2)`,
        [conversationId, memberId]
      );

    }

    return res.json({
      message: "Grupo creado",
      conversationId
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      message: "Error interno del servidor"
    });

  }

};


// =============================
// GET /conversations
// =============================
export const getUserConversations = async (req: AuthRequest, res: Response) => {

  try {

    const userId = req.userId;

    const result = await pool.query(
      `
      SELECT
        c.id,
        c.type,

        CASE
          WHEN c.type='private' THEN other_user.name
          ELSE c.name
        END AS name,

        CASE
          WHEN c.type='private' THEN other_user.profile_picture_url
          ELSE NULL
        END AS avatar,

        c.created_at,

        lm.content AS last_message,
        lm.sent_at AS last_message_time,
        lm.sender_id AS last_message_sender,

        cm.unread_count

      FROM mensajeria.conversation_members cm

      JOIN mensajeria.conversations c
      ON c.id = cm.conversation_id

      LEFT JOIN mensajeria.private_conversations pc
      ON pc.conversation_id = c.id

      LEFT JOIN mensajeria.users other_user
      ON other_user.id =
        CASE
          WHEN pc.user1 = $1 THEN pc.user2
          ELSE pc.user1
        END

      LEFT JOIN mensajeria.conversation_last_message lm
      ON lm.conversation_id = c.id

      WHERE cm.user_id=$1

      ORDER BY lm.sent_at DESC NULLS LAST
      `,
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
// GET /conversations/:id
// =============================
export const getConversation = async (req: AuthRequest, res: Response) => {

  try {

    const userId = req.userId;
    const { id } = req.params;

    const member = await pool.query(
      `SELECT 1
       FROM mensajeria.conversation_members
       WHERE conversation_id=$1
       AND user_id=$2`,
      [id, userId]
    );

    if (member.rows.length === 0) {
      return res.status(403).json({
        message: "No tienes acceso a esta conversación"
      });
    }

    const result = await pool.query(
      `SELECT *
       FROM mensajeria.conversations
       WHERE id=$1`,
      [id]
    );

    return res.json(result.rows[0]);

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      message: "Error interno del servidor"
    });

  }

};