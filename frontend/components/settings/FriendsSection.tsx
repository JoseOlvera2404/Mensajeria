"use client";

import { useEffect,useState } from "react";
import { getFriends } from "@/src/services/friend.service";
import api from "@/src/services/api";

export default function FriendsSection(){

  const [friends,setFriends] = useState<any[]>([]);

  const loadFriends = async ()=>{

    const data = await getFriends();

    setFriends(data);

  };

  useEffect(()=>{
    loadFriends();
  },[]);

  const removeFriend = async (id:string)=>{

    try{

      await api.delete("/friends/"+id);

      setFriends(prev => prev.filter(f => f.id !== id));

    }catch(err:any){

      alert(err.response?.data?.message || "Error");

    }

  };

  return(

    <div className="border rounded p-4 space-y-3">

      <h2 className="font-semibold">
        Amigos
      </h2>

      {friends.map(friend=>(
        <div
          key={friend.id}
          className="flex justify-between items-center"
        >

          <div className="flex items-center gap-2">

            <img
              src={friend.profile_picture_url || "/avatar.png"}
              className="w-8 h-8 rounded-full"
            />

            <span>{friend.name}</span>

          </div>

          <button
            onClick={()=>removeFriend(friend.id)}
            className="text-red-500"
          >
            Eliminar
          </button>

        </div>
      ))}

    </div>

  );

}