"use client";

import { useState } from "react";
import { registerUser } from "@/src/services/auth.service";
import { useRouter } from "next/navigation";

export default function RegisterPage() {

  const router = useRouter();

  const [name,setName] = useState("");
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault();

    try {

      await registerUser({
        name,
        email,
        password
      });

      router.push("/login");

    } catch (err) {
      console.error(err);
      alert("Error al registrar usuario");
    }

  };

  return (
    <div style={{maxWidth:400,margin:"100px auto"}}>

      <h2>Registro</h2>

      <form onSubmit={handleSubmit}>

        <input
          placeholder="Nombre"
          value={name}
          onChange={(e)=>setName(e.target.value)}
        />

        <input
          placeholder="Email"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
        />

        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
        />

        <button type="submit">
          Registrarse
        </button>

      </form>

    </div>
  );

}