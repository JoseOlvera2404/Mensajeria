"use client";

import { useState, useRef } from "react";
import { useChat } from "@/src/context/ChatContext";
import { sendMessage } from "@/src/services/message.service";
import { useAuth } from "@/src/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getSocket } from "@/src/services/socket.service";

export default function MessageInput(){

  const { activeConversation, addMessage } = useChat();
  const { user } = useAuth();

  const [text,setText] = useState("");

  const typingTimeout = useRef<any>(null);

  let socket:any = null;

  try{
    socket = getSocket();
  }catch{}

  const handleSend = async () => {

    if(!text.trim()) return;

    const content = text;

    setText("");

    // detener typing al enviar
    socket?.emit("stop_typing",{
      conversationId: activeConversation.id,
      userId: user?.id
    });

    const optimisticMessage = {
      tempId: Date.now(),
      sender_id: user?.id,
      content,
      conversationId: activeConversation.id,
      attachments: [],
      sent_at: new Date()
    };

    // mostrar mensaje instantáneo
    addMessage(optimisticMessage);

    try{

      await sendMessage({
        conversationId: activeConversation.id,
        content
      });

    }catch(err){

      console.error("error sending message",err);

    }

  };

  const handleTyping = (value:string)=>{

    setText(value);

    if(!socket) return;

    socket.emit("typing",{
      conversationId: activeConversation.id,
      userId: user?.id
    });

    // reset timeout
    if(typingTimeout.current){
      clearTimeout(typingTimeout.current);
    }

    typingTimeout.current = setTimeout(()=>{

      socket.emit("stop_typing",{
        conversationId: activeConversation.id,
        userId: user?.id
      });

    },1500);

  };

  if(!activeConversation) return null;

  return(

    <div className="p-3 border-t flex gap-2">

      <Input
        value={text}
        placeholder="Escribe un mensaje..."
        onChange={(e)=>handleTyping(e.target.value)}
        onKeyDown={(e)=>{
          if(e.key==="Enter"){
            e.preventDefault();
            handleSend();
          }
        }}
      />

      <Button onClick={handleSend}>
        Enviar
      </Button>

    </div>

  )

}