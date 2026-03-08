import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const connectSocket = (userId: string) => {

  if (socket) return socket;

  socket = io(
    process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000",
    {
      transports: ["websocket"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    }
  );

  socket.on("connect", () => {

    console.log("socket connected:", socket?.id);

    socket?.emit("register_user", userId);

  });

  socket.on("disconnect", () => {

    console.log("socket disconnected");

  });

  return socket;

};

export const getSocket = () => {

  if (!socket) {
    throw new Error("Socket not connected");
  }

  return socket;

};