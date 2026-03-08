const onlineUsers = new Map();
// ============================
// USER CONNECT
// ============================
export const userConnected = (userId, socketId) => {
    onlineUsers.set(userId, {
        userId,
        socketId
    });
};
// ============================
// USER DISCONNECT
// ============================
export const userDisconnected = (socketId) => {
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
export const isUserOnline = (userId) => {
    return onlineUsers.has(userId);
};
// ============================
// GET USER SOCKET
// ============================
export const getUserSocket = (userId) => {
    const user = onlineUsers.get(userId);
    return user?.socketId;
};
