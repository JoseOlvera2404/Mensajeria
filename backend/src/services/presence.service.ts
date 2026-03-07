type UserPresence = {
  userId: string;
  socketId: string;
  lastSeen?: Date;
};

const onlineUsers = new Map<string, UserPresence>();

// ============================
// USER CONNECT
// ============================

export const userConnected = (userId: string, socketId: string) => {

  onlineUsers.set(userId, {
    userId,
    socketId
  });

};

// ============================
// USER DISCONNECT
// ============================

export const userDisconnected = (socketId: string) => {

  for (const [userId, user] of onlineUsers.entries()) {

    if (user.socketId === socketId) {

      onlineUsers.set(userId, {
        ...user,
        lastSeen: new Date()
      });

      onlineUsers.delete(userId);
      break;

    }

  }

};

// ============================
// CHECK ONLINE
// ============================

export const isUserOnline = (userId: string) => {

  return onlineUsers.has(userId);

};

// ============================
// GET USER SOCKET
// ============================

export const getUserSocket = (userId: string) => {

  const user = onlineUsers.get(userId);
  return user?.socketId;

};