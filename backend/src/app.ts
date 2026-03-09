import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import pool from "./config/db.js";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import friendRoutes from "./routes/friend.routes.js";
import conversationRoutes from "./routes/conversation.routes.js";
import messageRoutes from "./routes/message.routes.js";

import { initSocket } from "./services/socket.service.js";

dotenv.config();

const app = express();

// ============================
// Middlewares
// ============================

app.use(cors({
  origin: "*",
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================
// Routes
// ============================

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/messages", messageRoutes);

// ============================
// Health check
// ============================

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    message: "API funcionando correctamente con WebSockets"
  });
});

// ============================
// DB test
// ============================

app.get("/db-test", async (_req: Request, res: Response) => {

  try {

    const result = await pool.query("SELECT NOW()");

    res.json({
      database: "connected",
      time: result.rows[0]
    });

  } catch (error) {

    console.error("DB connection error:", error);

    res.status(500).json({
      database: "error"
    });

  }

});

app.get("/", (_req, res) => {
  res.send("Backend running 🚀");
});

// ============================
// HTTP SERVER + SOCKET.IO
// ============================

const PORT = Number(process.env.PORT) || 4000;

const server = http.createServer(app);

// Inicializar Socket.IO
initSocket(server);

// ============================
// Start server
// ============================
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});