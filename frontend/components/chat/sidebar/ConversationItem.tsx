"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useChat } from "@/src/context/ChatContext";

export default function ConversationItem({ conversation }: any) {

  const { setActiveConversation } = useChat();

  const handleClick = () => {
    setActiveConversation(conversation);
  };

  return (

    <div
      onClick={handleClick}
      className="flex items-center gap-3 p-3 hover:bg-gray-100 cursor-pointer"
    >

      <Avatar>

        {conversation.avatar && (
          <AvatarImage src={conversation.avatar} />
        )}

        <AvatarFallback>
          {conversation.name?.[0] ?? "U"}
        </AvatarFallback>

      </Avatar>

      <div className="flex-1">

        <div className="flex justify-between">

          <div className="font-medium">
            {conversation.name}
          </div>

          {conversation.unread_count > 0 && (
            <div className="text-xs bg-blue-500 text-white px-2 rounded-full">
              {conversation.unread_count}
            </div>
          )}

        </div>

        <div className="text-sm text-gray-500 truncate">
          {conversation.last_message ?? "Sin mensajes"}
        </div>

      </div>

    </div>

  );

}