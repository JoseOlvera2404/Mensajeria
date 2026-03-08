import api from "./api";

export const getMessages = async (conversationId:string) => {

  const res = await api.get(`/messages/${conversationId}`);

  return res.data;

};

export const sendMessage = async (data:{
  conversationId:string
  content:string
}) => {

  const res = await api.post("/messages",data);

  return res.data;

};

export const markMessagesAsRead = async (data:{
  messageId:number
  conversationId:number
}) => {

  const res = await api.post("/messages/read",data);

  return res.data;

};

export const sendFileMessage = async (
  conversationId: string,
  file: File
) => {

  const formData = new FormData();

  formData.append("file", file);
  formData.append("conversationId", conversationId);

  const res = await api.post(
    "/messages/upload",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    }
  );

  return res.data;

};