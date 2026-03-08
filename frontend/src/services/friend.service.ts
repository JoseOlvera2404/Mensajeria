import api from "./api";

// ======================
// FRIEND LIST
// ======================

export const getFriends = async () => {
  const res = await api.get("/friends");
  return res.data;
};

// ======================
// SEND REQUEST
// ======================

export const sendFriendRequest = async (userId: string) => {
  const res = await api.post("/friends/request", { userId });
  return res.data;
};

// ======================
// FRIEND STATUS
// ======================

export const getFriendStatus = async (userId: string) => {
  const res = await api.get("/friends/status/" + userId);
  return res.data;
};

// ======================
// REQUEST LIST
// ======================

export const getFriendRequests = async () => {
  const res = await api.get("/friends/requests");
  return res.data;
};

// ======================
// ACCEPT REQUEST
// ======================

export const acceptFriendRequest = async (requestId: string) => {
  const res = await api.post("/friends/accept", { requestId });
  return res.data;
};

// ======================
// REJECT REQUEST
// ======================

export const rejectFriendRequest = async (requestId: string) => {
  const res = await api.post("/friends/reject", { requestId });
  return res.data;
};