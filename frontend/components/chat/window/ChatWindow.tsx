"use client";

import ChatHeader from "./ChatHeader";
import MessageList from "../messages/MessageList";
import MessageInput from "../messages/MessageInput";

export default function ChatWindow(){

  return(

    <div className="flex flex-1 flex-col">

      <ChatHeader/>

      <MessageList/>

      <MessageInput/>

    </div>

  )

}