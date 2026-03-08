import { Server, Socket } from "socket.io";
import pool from "../config/db.js";

import {
  userConnected,
  userDisconnected
} from "./presence.service.js";

let io: Server;

// usuarios escribiendo por conversación
const typingUsers: Map<string, Set<string>> = new Map();

export const initSocket = (server: any) => {

  io = new Server(server, {
    cors: {
      origin: "*"
    }
  });

  io.on("connection", (socket: Socket) => {

    console.log("User connected:", socket.id);

    // =========================
    // REGISTER USER
    // =========================
    socket.on("register_user", (userId: string) => {

      userConnected(userId, socket.id);

      // room personal
      socket.join(`user:${userId}`);

      io.emit("user_online", { userId });

    });

    // =========================
    // JOIN CONVERSATION
    // =========================

    socket.on("join_conversation",(conversationId)=>{
      console.log("JOIN ROOM",conversationId);
      socket.join(`conversation:${conversationId}`);
    });

    socket.on("leave_conversation", (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // =========================
    // TYPING START
    // =========================

    socket.on("typing", ({ conversationId, userId }) => {

      if (!typingUsers.has(conversationId)) {
        typingUsers.set(conversationId, new Set());
      }

      typingUsers.get(conversationId)!.add(userId);

      io.to(`conversation:${conversationId}`).emit("typing_users", {
        conversationId,
        users: Array.from(typingUsers.get(conversationId)!)
      });

    });

    // =========================
    // TYPING STOP
    // =========================

    socket.on("stop_typing", ({ conversationId, userId }) => {

      if (!typingUsers.has(conversationId)) return;

      typingUsers.get(conversationId)!.delete(userId);

      io.to(`conversation:${conversationId}`).emit("typing_users", {
        conversationId,
        users: Array.from(typingUsers.get(conversationId)!)
      });

    });

    // =========================
    // MESSAGE DELIVERED
    // =========================

    socket.on("message_delivered", ({ conversationId, messageId, userId }) => {

      socket.to(`conversation:${conversationId}`).emit("message_delivered", {
        messageId,
        userId
      });

    });

    // =========================
    // MESSAGE SEEN
    // =========================

    socket.on("message_seen", async ({ conversationId, messageId, userId }) => {

      try {

        await pool.query(
          `INSERT INTO mensajeria.message_reads
           (message_id, user_id)
           VALUES ($1,$2)
           ON CONFLICT DO NOTHING`,
          [messageId, userId]
        );

        await pool.query(
          `UPDATE mensajeria.conversation_members
           SET last_read_message_id=$1,
               unread_count = 0
           WHERE conversation_id=$2
           AND user_id=$3`,
          [messageId, conversationId, userId]
        );

        socket.to(`conversation:${conversationId}`).emit("message_seen", {
          messageId,
          userId,
          conversationId
        });

      } catch (error) {
        console.error(error);
      }

    });

    // =========================
    // DISCONNECT
    // =========================

    socket.on("disconnect", () => {

      userDisconnected(socket.id);

      console.log("User disconnected:", socket.id);

    });

  });

};

export const getIO = () => {

  if (!io) {
    throw new Error("Socket.io not initialized");
  }

  return io;

};