import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import pool from "./config/db.js";

console.log("Starting backend...");

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import friendRoutes from "./routes/friend.routes.js";
import conversationRoutes from "./routes/conversation.routes.js";
import messageRoutes from "./routes/message.routes.js";
import webauthnRoutes from "./routes/webauthn.routes.js";

import { initSocket } from "./services/socket.service.js";

dotenv.config();

console.log(
  "DATABASE_URL:",
  process.env.DATABASE_URL ? "OK" : "MISSING"
);

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
app.use("/api/webauthn", webauthnRoutes);

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

const PORT = Number(process.env.PORT) || 8080;

const startServer = async () => {
  try {

    // probar conexión DB
    await pool.query("SELECT 1");

    console.log("Database connected");

    const server = http.createServer(app);

    initSocket(server);

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (error) {

    console.error("Startup error:", error);
    process.exit(1);

  }
};

startServer();