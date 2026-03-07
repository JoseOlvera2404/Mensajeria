import { Response } from "express";
import pool from "../config/db.js";
import { AuthRequest } from "../middlewares/auth.middleware.js";
import { uploadChatFile } from "../services/cloudinary.service.js";


// =============================
// POST /messages
// =============================
export const sendMessage = async (req: AuthRequest, res: Response) => {

  try {

    const senderId = req.userId;
    const { conversationId, content } = req.body;

    if (!conversationId) {
      return res.status(400).json({
        message: "conversationId requerido"
      });
    }

    const member = await pool.query(
      `SELECT 1
       FROM mensajeria.conversation_members
       WHERE conversation_id=$1
       AND user_id=$2`,
      [conversationId, senderId]
    );

    if (member.rows.length === 0) {
      return res.status(403).json({
        message: "No perteneces a esta conversación"
      });
    }

    const result = await pool.query(
      `SELECT mensajeria.send_message(
        $1,$2,$3,'text'
      ) AS id`,
      [conversationId, senderId, content]
    );

    return res.json({
      messageId: result.rows[0].id
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      message: "Error interno del servidor"
    });

  }

};


// =============================
// GET /messages/:conversationId
// =============================
export const getMessages = async (req: AuthRequest, res: Response) => {

  try {

    const userId = req.userId;
    const { conversationId } = req.params;
    const { cursor } = req.query;

    const member = await pool.query(
      `SELECT 1
       FROM mensajeria.conversation_members
       WHERE conversation_id=$1
       AND user_id=$2`,
      [conversationId, userId]
    );

    if (member.rows.length === 0) {
      return res.status(403).json({
        message: "No tienes acceso"
      });
    }

    let cursorCondition = "";
    const params: any[] = [conversationId];

    if (cursor) {
      params.push(cursor);
      cursorCondition = `AND m.sent_at < $2`;
    }

    const result = await pool.query(
      `
      SELECT
        m.id,
        m.content,
        m.message_type,
        m.sent_at,
        m.sender_id,
        u.name,
        u.profile_picture_url,

        COALESCE(
          json_agg(
            json_build_object(
              'file_name', a.file_name,
              'file_type', a.file_type,
              'file_size', a.file_size,
              'file_url', a.file_url
            )
          ) FILTER (WHERE a.id IS NOT NULL),
          '[]'
        ) AS attachments

      FROM mensajeria.messages m

      JOIN mensajeria.users u
      ON u.id = m.sender_id

      LEFT JOIN mensajeria.message_attachments a
      ON a.message_id = m.id

      WHERE m.conversation_id=$1
      ${cursorCondition}

      GROUP BY m.id, u.id

      ORDER BY m.sent_at DESC
      LIMIT 50
      `,
      params
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
// POST /messages/read
// =============================
export const markMessagesAsRead = async (req: AuthRequest, res: Response) => {

  try {

    const userId = req.userId;
    const { messageId, conversationId } = req.body;

    if (!messageId) {
      return res.status(400).json({
        message: "messageId requerido"
      });
    }

    // compatibilidad con tabla message_reads
    await pool.query(
      `INSERT INTO mensajeria.message_reads
       (message_id,user_id)
       VALUES ($1,$2)
       ON CONFLICT DO NOTHING`,
      [messageId, userId]
    );

    // optimización principal
    if (conversationId) {

      await pool.query(
        `UPDATE mensajeria.conversation_members
         SET last_read_message_id=$1
         WHERE conversation_id=$2
         AND user_id=$3`,
        [messageId, conversationId, userId]
      );

    }

    return res.json({
      message: "Mensaje marcado como leído"
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      message: "Error interno del servidor"
    });

  }

};


// =============================
// POST /messages/upload
// =============================
export const sendFileMessage = async (req: AuthRequest, res: Response) => {

  try {

    const senderId = req.userId;
    const { conversationId } = req.body;

    if (!req.file) {
      return res.status(400).json({
        message: "Archivo requerido"
      });
    }

    const upload = await uploadChatFile(req.file.buffer);

    const message = await pool.query(
      `SELECT mensajeria.send_message(
        $1,$2,NULL,'file'
      ) AS id`,
      [conversationId, senderId]
    );

    const messageId = message.rows[0].id;

    await pool.query(
      `INSERT INTO mensajeria.message_attachments
       (message_id,file_name,file_type,file_size,file_url,file_public_id)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        messageId,
        req.file.originalname,
        req.file.mimetype,
        req.file.size,
        upload.secure_url,
        upload.public_id
      ]
    );

    return res.json({
      message: "Archivo enviado",
      messageId,
      fileUrl: upload.secure_url
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      message: "Error interno del servidor"
    });

  }

};