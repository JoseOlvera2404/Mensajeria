"use client";

import ConversationList from "./ConversationList";
import UserProfile from "./UserProfile";
import SearchUsers from "./SearchUsers";
import FriendRequests from "./FriendRequest";
import NewConversationButton from "./NewConversationButton";

export default function ChatSidebar(){

  return(

    <div className="w-72 border-r bg-white flex flex-col h-full overflow-hidden">

      <UserProfile/>
      <SearchUsers/>
      <FriendRequests/>

      <div className="p-4 flex justify-between items-center border-b">

        <span className="text-lg font-semibold">
          Conversaciones
        </span>

        <NewConversationButton/>

      </div>

      <div className="flex-1 overflow-hidden">
        <ConversationList/>
      </div>

    </div>

  )

}