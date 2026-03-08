"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useChat } from "@/src/context/ChatContext";
import { useEffect, useState } from "react";
import { getSocket } from "@/src/services/socket.service";
import { useAuth } from "@/src/context/AuthContext";
import api from "@/src/services/api";

export default function ChatHeader(){

  const { activeConversation } = useChat();
  const { user } = useAuth();

  const [typingUsers,setTypingUsers] = useState<any[]>([]);

  useEffect(()=>{

    let socket:any = null;

    try{
      socket = getSocket();
    }catch{
      return;
    }

    const handleTyping = async (data:any)=>{

      if(data.conversationId !== activeConversation?.id) return;

      const filtered = data.users.filter((u:any)=>u !== user?.id);

      if(filtered.length === 0){
        setTypingUsers([]);
        return;
      }

      const users = await Promise.all(
        filtered.map(async(id:any)=>{
          const res = await api.get(`/users/${id}`);
          return res.data;
        })
      );

      setTypingUsers(users);

    };

    socket.on("typing_users",handleTyping);

    return ()=>{
      socket.off("typing_users",handleTyping);
    };

  },[activeConversation,user]);

  const typingText = ()=>{

    if(typingUsers.length === 1){
      return `${typingUsers[0].name.split(" ")[0]} está escribiendo...`;
    }

    if(typingUsers.length === 2){
      return `${typingUsers[0].name.split(" ")[0]} y ${typingUsers[1].name.split(" ")[0]} están escribiendo...`;
    }

    if(typingUsers.length >= 3){
      return "Varios están escribiendo...";
    }

    return "online";

  };

  return(

    <div className="flex items-center gap-3 border-b p-4 bg-white">

      <Avatar>

        {activeConversation?.avatar && (
          <AvatarImage src={activeConversation.avatar}/>
        )}

        <AvatarFallback>
          {activeConversation?.name?.[0] ?? "U"}
        </AvatarFallback>

      </Avatar>

      <div>

        <div className="font-semibold">
          {activeConversation?.name ?? "Usuario"}
        </div>

        <div className="text-xs text-gray-500">
          {typingUsers.length > 0 ? typingText() : "online"}
        </div>

      </div>

    </div>

  );

}