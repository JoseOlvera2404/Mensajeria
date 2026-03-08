"use client";

import { useState } from "react";
import api from "@/src/services/api";

export default function PasswordSection(){

  const [currentPassword,setCurrentPassword] = useState("");
  const [newPassword,setNewPassword] = useState("");

  const changePassword = async ()=>{

    if(!currentPassword || !newPassword){
      alert("Debes llenar ambos campos");
      return;
    }

    try{

      await api.patch("/auth/password",{
        currentPassword,
        newPassword
      });

      alert("Contraseña actualizada");

      setCurrentPassword("");
      setNewPassword("");

    }catch(err:any){

      alert(err.response?.data?.message || "Error");

    }

  };

  return(

    <div className="border rounded p-4 space-y-3">

      <h2 className="font-semibold">
        Cambiar contraseña
      </h2>

      <input
        type="password"
        placeholder="Contraseña actual"
        value={currentPassword}
        onChange={(e)=>setCurrentPassword(e.target.value)}
        className="border p-2 rounded w-full"
      />

      <input
        type="password"
        placeholder="Nueva contraseña"
        value={newPassword}
        onChange={(e)=>setNewPassword(e.target.value)}
        className="border p-2 rounded w-full"
      />

      <button
        onClick={changePassword}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Cambiar contraseña
      </button>

    </div>

  );

}