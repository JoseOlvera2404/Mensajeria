"use client";

import { useState } from "react";
import { registerUser } from "@/src/services/auth.service";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function RegisterPage() {

  const router = useRouter();

  const [name,setName] = useState("");
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [error,setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault();
    setError("");

    try {

      await registerUser({
        name,
        email,
        password
      });

      router.push("/login");

    } catch {

      setError("Error al registrar usuario");

    }

  };

  return (

    <div className="flex min-h-screen items-center justify-center bg-gray-100">

      <Card className="w-96 p-6 space-y-5">

        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold">
            Crear cuenta
          </h1>

          <p className="text-sm text-gray-500">
            Regístrate para comenzar a usar el chat
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >

          <Input
            placeholder="Nombre"
            value={name}
            onChange={(e)=>setName(e.target.value)}
          />

          <Input
            placeholder="Email"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
          />

          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
          />

          {error && (
            <p className="text-sm text-red-500 text-center">
              {error}
            </p>
          )}

          <Button className="w-full">
            Registrarse
          </Button>

        </form>

        <p className="text-sm text-center text-gray-600">

          ¿Ya tienes cuenta?{" "}
          <Link
            href="/login"
            className="text-blue-600 hover:underline"
          >
            Inicia sesión
          </Link>

        </p>

      </Card>

    </div>

  );

}