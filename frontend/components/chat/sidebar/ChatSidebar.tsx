"use client";

import ConversationList from "./ConversationList";

export default function ChatSidebar(){

  return(

    <div className="w-72 border-r bg-white">

      <div className="p-4 text-xl font-bold border-b">
        Mensajes
      </div>

      <ConversationList/>

    </div>

  )

}