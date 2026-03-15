"use client";

import { createContext, useContext, useState } from "react";

type ChatContextType = {
  activeConversation: any;
  setActiveConversation: (c:any)=>void;

  messages: any[];
  setMessages: (m:any[])=>void;

  addMessage: (m:any)=>void;

  markMessageSeen: (messageId:string,userId:string)=>void;
};

const ChatContext = createContext<ChatContextType | null>(null);

export const ChatProvider = ({children}:{children:React.ReactNode}) => {

  const [activeConversation,setActiveConversation] = useState<any>(null);
  const [messages,setMessages] = useState<any[]>([]);

  const addMessage = (message:any) => {

    setMessages(prev => {

      // evitar duplicados
      if(prev.some(m => m.id === message.id)){
        return prev;
      }

      // reemplazar mensaje optimista
      const optimisticIndex = prev.findIndex(
        m =>
          m.id?.startsWith("temp_") &&
          m.content === message.content &&
          m.sender_id === message.sender_id
      );

      if(optimisticIndex !== -1){

        const updated = [...prev];
        updated[optimisticIndex] = message;

        return updated;

      }

      return [...prev, message];

    });

  };

  // ==========================
  // MARK MESSAGE SEEN
  // ==========================
  const markMessageSeen = (messageId:string,userId:string)=>{

    setMessages(prev =>

      prev.map(m => {

        // solo marcar mensajes enviados por mí
        if(m.sender_id){

          const seenBy = Array.isArray(m.seen_by) ? m.seen_by : [];

          if(seenBy.includes(userId)) return m;

          return {
            ...m,
            seen_by:[...seenBy,userId]
          };

        }

        return m;

      })

    );

  };

  return(

    <ChatContext.Provider
      value={{
        activeConversation,
        setActiveConversation,
        messages,
        setMessages,
        addMessage,
        markMessageSeen
      }}
    >

      {children}

    </ChatContext.Provider>

  );

};

export const useChat = () => {

  const context = useContext(ChatContext);

  if(!context){
    throw new Error("useChat must be used inside ChatProvider");
  }

  return context;

};