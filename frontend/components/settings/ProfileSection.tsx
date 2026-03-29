"use client";

import { useState, useRef } from "react";
import api from "@/src/services/api";
import { useAuth } from "@/src/context/AuthContext";
import { startRegistration } from "@simplewebauthn/browser";


export default function ProfileSection(){

  const { user } = useAuth();

  const [name,setName] = useState(user?.name || "");
  const [file,setFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const saveProfile = async ()=>{

    await api.patch("/users/profile",{ name });

    alert("Nombre actualizado");

  };

  const uploadPhoto = async ()=>{

    if(!file){
      alert("Selecciona una imagen primero");
      return;
    }

    const formData = new FormData();
    formData.append("file",file);

    await api.patch("/users/profile-picture",formData,{
      headers:{ "Content-Type":"multipart/form-data" }
    });

    alert("Foto actualizada");

    setFile(null);

  };


  const handleRegisterBiometric = async () => {
    try {

      const optionsRes = await api.post("/webauthn/register/options");

      console.log(optionsRes.data);

      const registration = await startRegistration(optionsRes.data);

      await api.post("/webauthn/register/verify", {
        credential: registration
      });

      alert("Biometría activada");

    } catch (e) {
      console.error(e);
      alert("Error registrando biometría");
    }
  };

  const openFilePicker = ()=>{
    fileInputRef.current?.click();
  };

  return(

    <div className="border rounded p-4 space-y-4">

      <h2 className="font-semibold text-lg">
        Perfil
      </h2>

      <div className="flex gap-4 items-center">

        <img
          src={
            file
              ? URL.createObjectURL(file)
              : user?.profile_picture_url || "/avatar.png"
          }
          className="w-16 h-16 rounded-full object-cover cursor-pointer hover:opacity-80"
          onClick={openFilePicker}
        />

        <div className="flex flex-col gap-2">

          <button
            onClick={openFilePicker}
            className="text-sm text-blue-600 hover:underline"
          >
            Seleccionar imagen
          </button>

          <button
            onClick={uploadPhoto}
            className="text-sm bg-blue-600 text-white px-3 py-1 rounded"
          >
            Cambiar foto
          </button>

        </div>

        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={(e)=>setFile(e.target.files?.[0] || null)}
        />

      </div>

      <div className="space-y-2">

        <label className="text-sm text-gray-600">
          Nombre
        </label>

        <input
          value={name}
          onChange={(e)=>setName(e.target.value)}
          className="border p-2 rounded w-full"
        />

        <button
          onClick={saveProfile}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Guardar nombre
        </button>

      </div>

      <div className="space-y-2">
        <button
          onClick={handleRegisterBiometric}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Activar biometría (Web)
        </button>
      </div>

    </div>

  );

}