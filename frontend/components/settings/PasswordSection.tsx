"use client";

import { useState } from "react";

import {
  requestPasswordChangeCode,
  changePassword
} from "@/src/services/auth.service";

export default function PasswordSection(){

  const [step,setStep] = useState(1);

  const [newPassword,setNewPassword] = useState("");
  const [code,setCode] = useState("");

  const sendCode = async ()=>{

    await requestPasswordChangeCode();

    alert("Código enviado a tu correo");

    setStep(2);

  };

  const updatePassword = async ()=>{

    try{

      await changePassword({
        newPassword,
        code
      });

      alert("Contraseña actualizada");

      setNewPassword("");
      setCode("");

      setStep(1);

    }catch(err:any){

      alert(err.response?.data?.message || "Error");

    }

  };

  return(

    <div className="border rounded p-4 space-y-4">

      <h2 className="font-semibold">
        Cambiar contraseña
      </h2>

      {step === 1 && (

        <button
          onClick={sendCode}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Enviar código
        </button>

      )}

      {step === 2 && (

        <>

          <input
            type="text"
            placeholder="Código"
            value={code}
            onChange={(e)=>setCode(e.target.value)}
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
            onClick={updatePassword}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Confirmar cambio
          </button>

        </>

      )}

    </div>

  );

}