import { Response } from "express";
import pool from "../config/db.js";
import { AuthRequest } from "../middlewares/auth.middleware.js";
import { uploadChatFile } from "../services/cloudinary.service.js";
import { getIO } from "../services/socket.service.js";
import { encrypt, decrypt } from "../services/encryption.service.js";
import { askAI } from "../services/ai.service.js";

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

    if (!content || content.trim() === "") {
      return res.status(400).json({
        message: "El mensaje no puede estar vacío"
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

    // 🔐 CIFRAR MENSAJE
    const encryptedContent = encrypt(content);

    const result = await pool.query(
      `SELECT mensajeria.send_message(
        $1,$2,$3,'text'
      ) AS id`,
      [conversationId, senderId, encryptedContent]
    );

    const messageId = result.rows[0].id;

    const message = {
      id: messageId,
      conversationId,
      sender_id: senderId,
      content,
      message_type: "text",
      attachments: [],
      sent_at: new Date()
    };

    const io = getIO();

    const members = await pool.query(
      `SELECT user_id
       FROM mensajeria.conversation_members
       WHERE conversation_id=$1`,
      [conversationId]
    );

    io.to(`conversation:${conversationId}`).emit("new_message", message);

    // =============================
    // RESPUESTA DEL CHATBOT
    // =============================

    const botId = process.env.CHATBOT_USER_ID;

    if(botId){

      const isBotConversation = members.rows.some(
        (m:any)=>m.user_id === botId
      );

      if(isBotConversation && senderId !== botId){

        const aiReply = await askAI(conversationId, content);

        const encryptedReply = encrypt(aiReply);

        const botMessage = await pool.query(
          `SELECT mensajeria.send_message(
            $1,$2,$3,'text'
          ) AS id`,
          [
            conversationId,
            botId,
            encryptedReply
          ]
        );

        const botPayload = {
          id: botMessage.rows[0].id,
          conversationId,
          sender_id: botId,
          content: aiReply,
          message_type: "text",
          attachments: [],
          sent_at: new Date()
        };

        io.to(`conversation:${conversationId}`).emit("new_message", botPayload);

      }

    }

    // =============================

    return res.json(message);

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
       WHERE conversation_id = $1
       AND user_id = $2`,
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
        m.conversation_id,
        m.content,
        m.message_type,
        m.sent_at,
        m.sender_id,

        json_build_object(
          'id', u.id,
          'name', u.name,
          'profile_picture_url', u.profile_picture_url
        ) AS sender,

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

      WHERE m.conversation_id = $1
      ${cursorCondition}

      GROUP BY
        m.id,
        u.id

      ORDER BY m.sent_at DESC
      LIMIT 50
      `,
      params
    );

    // 🔓 DESCIFRAR MENSAJES
    const messages = result.rows.map((m:any)=>{

      let decryptedContent = null;

      if(m.content){
        try{
          decryptedContent = decrypt(m.content);
        }catch{
          decryptedContent = "[mensaje corrupto]";
        }
      }

      return {
        ...m,
        content: decryptedContent
      };

    });

    return res.json(messages);

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

    await pool.query(
      `INSERT INTO mensajeria.message_reads
       (message_id,user_id)
       VALUES ($1,$2)
       ON CONFLICT DO NOTHING`,
      [messageId, userId]
    );

    if (conversationId) {

      await pool.query(
        `UPDATE mensajeria.conversation_members
         SET last_read_message_id=$1,
             unread_count = 0
         WHERE conversation_id=$2
         AND user_id=$3`,
        [messageId, conversationId, userId]
      );

      const io = getIO();

      io.to(`conversation:${conversationId}`).emit("message_seen", {
        messageId,
        userId,
        conversationId
      });

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

    if (!conversationId) {
      return res.status(400).json({
        message: "conversationId requerido"
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "Archivo requerido"
      });
    }

    const mimetype = req.file.mimetype;

    let messageType: "image" | "video" | "audio" | "file" = "file";

    if (mimetype.startsWith("image/")) messageType = "image";
    else if (mimetype.startsWith("video/")) messageType = "video";
    else if (mimetype.startsWith("audio/")) messageType = "audio";

    const upload = await uploadChatFile(req.file.buffer);

    const message = await pool.query(
      `SELECT mensajeria.send_message(
        $1,$2,NULL,$3
      ) AS id`,
      [conversationId, senderId, messageType]
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

    const io = getIO();

    const payload = {
      id: messageId,
      conversationId,
      sender_id: senderId,
      message_type: messageType,
      attachments:[
        {
          file_url: upload.secure_url,
          file_type: req.file.mimetype
        }
      ],
      sent_at: new Date()
    };

    const members = await pool.query(
      `
      SELECT user_id
      FROM mensajeria.conversation_members
      WHERE conversation_id=$1
      `,
      [conversationId]
    );

    io.to(`conversation:${conversationId}`).emit("new_message", payload);

    return res.json(payload);

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      message: "Error interno del servidor"
    });

  }

};