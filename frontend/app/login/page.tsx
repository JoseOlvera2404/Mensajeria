"use client";

import { useState } from "react";
import { loginUser } from "@/src/services/auth.service";
import { useRouter } from "next/navigation";

export default function LoginPage() {

  const router = useRouter();

  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault();

    try {

      const data = await loginUser({
        email,
        password
      });

      localStorage.setItem("token",data.token);

      router.push("/dashboard");

    } catch (err) {
      console.error(err);
      alert("Credenciales inválidas");
    }

  };

  return (
    <div style={{maxWidth:400,margin:"100px auto"}}>

      <h2>Login</h2>

      <form onSubmit={handleSubmit}>

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
          Iniciar sesión
        </button>

      </form>

    </div>
  );

}