import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";

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

app.use(cors());
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

app.get("/api/health", (req, res) => {
  res.json({ message: "API funcionando correctamente con WebSockets" });
});

// ============================
// HTTP SERVER + SOCKET.IO
// ============================

const PORT = process.env.PORT || 4000;

const server = http.createServer(app);

initSocket(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});