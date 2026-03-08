"use client";

import { useEffect, useState } from "react";
import api from "@/src/services/api";
import {
  getFriendStatus,
  sendFriendRequest,
  getFriends
} from "@/src/services/friend.service";

export default function SearchUsers(){

  const [query,setQuery] = useState("");
  const [results,setResults] = useState<any[]>([]);
  const [friends,setFriends] = useState<string[]>([]);

  // cargar amigos
  useEffect(()=>{

    const loadFriends = async ()=>{

      const data = await getFriends();

      setFriends(data.map((f:any)=>String(f.id)));

    };

    loadFriends();

  },[]);

  const search = async (value:string)=>{

    setQuery(value);

    if(value.length < 2){
      setResults([]);
      return;
    }

    const res = await api.get("/users/search?q="+value);

    const users = await Promise.all(

      res.data.map(async (user:any)=>{

        const status = await getFriendStatus(user.id);

        return {
          ...user,
          friendStatus: status.status
        };

      })

    );

    setResults(users);

  };

  const addFriend = async (userId:string)=>{

    try{

      await sendFriendRequest(userId);

      alert("Solicitud enviada");

    }catch(e:any){

      alert(e.response?.data?.message || "Error");

    }

  };

  return(

    <div className="p-3 border-b">

      <input
        value={query}
        onChange={(e)=>search(e.target.value)}
        placeholder="Buscar usuarios..."
        className="w-full border rounded p-2 text-sm"
      />

      <div className="mt-2 space-y-2">

        {results.map(user => {

          return(

            <div
              key={user.id}
              className="flex items-center justify-between text-sm"
            >

              <span>{user.name}</span>

              {user.friendStatus === "accepted" && (
                <span className="text-gray-400">
                  Amigos
                </span>
              )}

              {user.friendStatus === "pending" && (
                <span className="text-yellow-500">
                  Pendiente
                </span>
              )}

              {user.friendStatus === "none" && (
                <button
                  onClick={()=>addFriend(user.id)}
                  className="text-blue-500"
                >
                  Agregar
                </button>
              )}

              {user.friendStatus === "blocked" && (
                <span className="text-red-500">
                  Bloqueado
                </span>
              )}

            </div>

          )

        })}

      </div>

    </div>

  )

}