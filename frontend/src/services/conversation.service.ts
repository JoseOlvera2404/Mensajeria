import api from "./api";

export const getConversations = async () => {

  const res = await api.get("/conversations");

  return res.data;

};

export const createDirectConversation = async (userId:string)=>{
  const res = await api.post("/conversations/private",{ userId });
  return res.data;
};

export const createGroupConversation = async (name:string)=>{
  const res = await api.post("/conversations/group",{ name });
  return res.data;
};