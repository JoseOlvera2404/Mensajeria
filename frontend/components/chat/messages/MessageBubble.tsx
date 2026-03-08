"use client";

import { useAuth } from "@/src/context/AuthContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export default function MessageBubble({ message }: any) {

  const { user } = useAuth();

  const mine =
    message.sender_id === user?.id ||
    message.senderId === user?.id;

  const attachment = message.attachments?.[0];

  const seenBy = message.seen_by || [];

  // visto solo si alguien diferente a mí lo vio
  const seen = seenBy.some((u:any) => String(u) !== String(user?.id));

  return (

    <div className={`flex gap-2 ${mine ? "justify-end" : "justify-start"}`}>

      {!mine && (

        <Avatar className="w-8 h-8">

          {message.sender?.profile_picture_url && (
            <AvatarImage src={message.sender.profile_picture_url} />
          )}

          <AvatarFallback>
            {message.sender?.name?.[0] ?? "U"}
          </AvatarFallback>

        </Avatar>

      )}

      <div>

        <div
          className={`
            max-w-xs px-3 py-2 rounded-lg
            ${mine ? "bg-blue-600 text-white" : "bg-gray-200"}
          `}
        >

          {message.sender?.name && !mine && (
            <div className="text-xs font-semibold mb-1">
              {message.sender.name}
            </div>
          )}

          {message.content && (
            <div className="mb-1">{message.content}</div>
          )}

          {attachment && attachment.file_type?.startsWith("image") && (
            <img
              src={attachment.file_url}
              className="rounded-md max-h-60 object-cover"
            />
          )}

          {attachment && !attachment.file_type?.startsWith("image") && (

            <a
              href={attachment.file_url}
              target="_blank"
              className="text-sm underline"
            >
              Descargar archivo
            </a>

          )}

        </div>

        {mine && (

          <div
            className={`
              text-[11px] mt-1 text-right
              ${seen ? "text-blue-500" : "text-gray-400"}
            `}
          >

            {seen ? "✓✓" : "✓"}

          </div>

        )}

      </div>

    </div>

  );

}