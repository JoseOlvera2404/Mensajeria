"use client";

import { useAuth } from "@/src/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import ChatLayout from "@/components/chat/ChatLayout";

export default function DashboardPage(){

  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {

    if(!loading && !user){
      router.push("/login");
    }

  }, [user, loading, router]);

  if(loading){
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-gray-500">Cargando...</p>
      </div>
    )
  }

  if(!user){
    return null;
  }

  return <ChatLayout/>;

}