"use client";

import { useEffect, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import MessageBubble from "./MessageBubble";
import { useChat } from "@/src/context/ChatContext";
import { getMessages } from "@/src/services/message.service";
import { getSocket } from "@/src/services/socket.service";
import { markMessagesAsRead } from "@/src/services/message.service";
import { useAuth } from "@/src/context/AuthContext";

export default function MessageList(){

  const {
    activeConversation,
    messages,
    setMessages,
    addMessage,
    markMessageSeen
  } = useChat();

  const bottomRef = useRef<HTMLDivElement>(null);

  const activeConversationRef = useRef<any>(null);

  const socketRef = useRef<any>(null);

  const { user } = useAuth();

  const [showScrollButton,setShowScrollButton] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // mantener conversación actual en ref
  useEffect(()=>{
      activeConversationRef.current = activeConversation;
    },[activeConversation]);

    useEffect(()=>{

    const el = containerRef.current;

    if(!el) return;

    const handleScroll = ()=>{

      const distanceFromBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight;

      if(distanceFromBottom > 120){
        setShowScrollButton(true);
      }else{
        setShowScrollButton(false);
      }

    };

    el.addEventListener("scroll",handleScroll);

    return ()=>{
      el.removeEventListener("scroll",handleScroll);
    };

  },[]);

  // ===============================
  // CARGAR MENSAJES
  // ===============================
  useEffect(()=>{

    if(!activeConversation) return;

    const socket = getSocket();

    socket.emit("join_conversation", activeConversation.id);

    const loadMessages = async () => {

      const data = await getMessages(activeConversation.id);

      const messagesOrdered = data.reverse();

      setMessages(messagesOrdered);

      if(messagesOrdered.length > 0){

        const lastMessage = messagesOrdered[messagesOrdered.length - 1];

        await markMessagesAsRead({
          messageId:lastMessage.id,
          conversationId:activeConversation.id
        });

      }

    };

    loadMessages();

    return ()=>{
      socket.emit("leave_conversation", activeConversation.id);
    };

  },[activeConversation]);

  // ===============================
  // ESCUCHAR MENSAJES
  // ===============================
  useEffect(()=>{

    try{
      socketRef.current = getSocket();
    }catch{
      return;
    }

    const handleMessage = async (msg:any)=>{

      const currentConversation = activeConversationRef.current;

      if(!currentConversation) return;

      const convId = msg.conversationId || msg.conversation_id;

      if(String(convId) === String(currentConversation.id)){

        addMessage({
          ...msg,
          id: msg.id ?? msg.tempId
        });

        // solo marcar leído si el mensaje NO es mío
        if(msg.sender_id !== user?.id){

          await markMessagesAsRead({
            messageId:msg.id,
            conversationId:currentConversation.id
          });

        }

      }

    };

    // ===============================
    // MESSAGE SEEN
    // ===============================

    const handleSeen = (data:any)=>{

      const currentConversation = activeConversationRef.current;

      if(!currentConversation) return;

      if(String(data.conversationId) !== String(currentConversation.id)) return;

      markMessageSeen(data.messageId,data.userId);

    };

    socketRef.current.on("new_message",handleMessage);
    socketRef.current.on("message_seen",handleSeen);

    return ()=>{

      socketRef.current?.off("new_message",handleMessage);
      socketRef.current?.off("message_seen",handleSeen);

    };

  },[]);

  // ===============================
  // AUTOSCROLL
  // ===============================
  useEffect(()=>{

  if(!showScrollButton){
      bottomRef.current?.scrollIntoView({
        behavior:"smooth"
      });
    }
  },[messages]);

  if(!activeConversation){

    return(
      <div className="flex-1 flex items-center justify-center text-gray-500">
        Selecciona una conversación
      </div>
    );

  }

  return(

    <div className="relative h-full">

      <ScrollArea className="h-full p-4">

        <div
          ref={containerRef}
          className="space-y-3"
        >

          {messages.map((m)=>(
            <MessageBubble
              key={m.id ?? m.tempId}
              message={m}
            />
          ))}

          <div ref={bottomRef}></div>

        </div>

      </ScrollArea>

      {showScrollButton && (

        <button
          onClick={()=>{
            bottomRef.current?.scrollIntoView({
              behavior:"smooth"
            });
          }}
          className="
            absolute bottom-20 right-6
            bg-blue-600 text-white
            px-3 py-1 rounded-full
            text-sm shadow
          "
        >
          ↓ nuevos mensajes
        </button>

      )}

    </div>

  );

}