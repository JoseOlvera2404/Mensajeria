"use client";

import { useEffect, useState } from "react";
import {
  getFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest
} from "@/src/services/friend.service";

export default function FriendRequests(){

  const [requests,setRequests] = useState<any[]>([]);
  const [open,setOpen] = useState(false);

  const loadRequests = async ()=>{

    const data = await getFriendRequests();

    setRequests(data);

  };

  useEffect(()=>{

    loadRequests();

  },[]);

  const accept = async (id:string)=>{

    await acceptFriendRequest(id);

    setRequests(prev => prev.filter(r=>r.id!==id));

  };

  const reject = async (id:string)=>{

    await rejectFriendRequest(id);

    setRequests(prev => prev.filter(r=>r.id!==id));

  };

  return(

    <div className="border-b">

      <button
        onClick={()=>setOpen(!open)}
        className="w-full p-3 text-left font-semibold flex justify-between"
      >
        Solicitudes
        {requests.length > 0 && (
          <span className="text-sm bg-red-500 text-white rounded px-2">
            {requests.length}
          </span>
        )}
      </button>

      {open && (

        <div className="p-2 space-y-2">

          {requests.length === 0 && (
            <p className="text-sm text-gray-500">
              No hay solicitudes
            </p>
          )}

          {requests.map(req => (

            <div
              key={req.id}
              className="flex items-center justify-between text-sm"
            >

              <span>{req.name}</span>

              <div className="flex gap-2">

                <button
                  onClick={()=>accept(req.id)}
                  className="text-green-600"
                >
                  Aceptar
                </button>

                <button
                  onClick={()=>reject(req.id)}
                  className="text-red-600"
                >
                  Rechazar
                </button>

              </div>

            </div>

          ))}

        </div>

      )}

    </div>

  )

}