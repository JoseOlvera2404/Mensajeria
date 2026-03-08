"use client";

import { useState, useEffect } from "react";
import { getFriends } from "@/src/services/friend.service";
import { createDirectConversation } from "@/src/services/conversation.service";
import { useChat } from "@/src/context/ChatContext";

export default function NewConversationButton(){

  const [open,setOpen] = useState(false);
  const [friends,setFriends] = useState<any[]>([]);

  const { setActiveConversation } = useChat();

  useEffect(()=>{

    const loadFriends = async ()=>{

      const data = await getFriends();
      setFriends(data);

    };

    if(open){
      loadFriends();
    }

  },[open]);

  const startChat = async (userId:string)=>{

    const res = await createDirectConversation(userId);

    setActiveConversation({
      id: res.conversationId
    });

    setOpen(false);

  };

  return(

    <>

      <button
        onClick={()=>setOpen(true)}
        className="text-xl"
      >
        +
      </button>

      {open && (

        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">

          <div className="bg-white rounded-lg p-4 w-80 shadow-xl">

            <h2 className="font-semibold mb-3">
              Nueva conversación
            </h2>

            <div className="space-y-2 max-h-60 overflow-y-auto">

              {friends.map(friend=>(
                <div
                  key={friend.id}
                  className="flex justify-between items-center"
                >

                  <span>{friend.name}</span>

                  <button
                    onClick={()=>startChat(friend.id)}
                    className="text-blue-500"
                  >
                    Chat
                  </button>

                </div>
              ))}

            </div>

            <button
              onClick={()=>setOpen(false)}
              className="mt-4 text-sm text-gray-500"
            >
              Cerrar
            </button>

          </div>

        </div>

      )}

    </>

  );

}