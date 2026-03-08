import axios from "axios";
import pool from "../config/db.js";
import { decrypt } from "./encryption.service.js";

export const askAI = async (
  conversationId: string,
  userMessage: string
) => {

  const historyResult = await pool.query(
  `
  SELECT content, sender_id
  FROM mensajeria.messages
  WHERE conversation_id=$1
  ORDER BY sent_at DESC
  LIMIT 10
  `,
  [conversationId]
  );

  const history = historyResult.rows.reverse().map((m:any)=>{

    let text = "";

    try{
      text = decrypt(m.content);
    }catch{
      text = "";
    }

    return {
      role: m.sender_id === process.env.CHATBOT_USER_ID
        ? "assistant"
        : "user",
      content: text
    };

  });

  const messages = [
    {
      role: "system",
      content: "Eres un asistente útil dentro de una aplicación de chat."
    },
    ...history,
    {
      role: "user",
      content: userMessage
    }
  ];

  const res = await axios.post(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      model: "mistralai/mistral-small-3.1-24b-instruct",
      messages
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost"
      }
    }
  );

  return res.data.choices[0].message.content;

};