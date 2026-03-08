"use client";

import { useEffect, useState, useRef } from "react";
import { getConversations } from "@/src/services/conversation.service";
import ConversationItem from "./ConversationItem";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getSocket } from "@/src/services/socket.service";
import { useChat } from "@/src/context/ChatContext";

export default function ConversationList(){

  const [conversations,setConversations] = useState<any[]>([]);

  const socketRef = useRef<any>(null);

  const { activeConversation } = useChat();

  useEffect(()=>{

    const load = async () => {

      const data = await getConversations();

      setConversations(data);

    };

    load();

    try{
      socketRef.current = getSocket();
    }catch{
      return;
    }

    const handleMessage = (msg:any)=>{

      const convId = msg.conversationId || msg.conversation_id;

      setConversations(prev => {

        const updated = prev.map((c:any)=>{

          if(String(c.id) === String(convId)){

            const isActive = String(activeConversation?.id) === String(convId);

            return {
              ...c,
              last_message: msg.content,
              unread_count: isActive ? 0 : (c.unread_count || 0) + 1
            };

          }

          return c;

        });

        // mover conversación al inicio
        const sorted = [...updated].sort((a,b)=>{
          if(String(a.id) === String(convId)) return -1;
          if(String(b.id) === String(convId)) return 1;
          return 0;
        });

        return sorted;

      });

    };

    socketRef.current.on("new_message",handleMessage);

    return ()=>{
      socketRef.current?.off("new_message",handleMessage);
    };

  },[activeConversation]);

  // =============================
  // RESET UNREAD CUANDO ABRES CHAT
  // =============================

  useEffect(()=>{

    if(!activeConversation) return;

    setConversations(prev => {

      return prev.map(c => {

        if(String(c.id) === String(activeConversation.id)){

          return {
            ...c,
            unread_count: 0
          };

        }

        return c;

      });

    });

  },[activeConversation]);

  return(

    <ScrollArea className="h-[calc(100vh-60px)]">

      {conversations.map((c:any)=>(
        <ConversationItem
          key={c.id}
          conversation={c}
        />
      ))}

    </ScrollArea>

  )

}