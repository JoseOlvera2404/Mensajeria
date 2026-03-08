"use client";

import { useState } from "react";
import {
  registerUser,
  requestRegisterCode
} from "@/src/services/auth.service";

import { useRouter } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function RegisterPage(){

  const router = useRouter();

  const [step,setStep] = useState(1);

  const [name,setName] = useState("");
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [code,setCode] = useState("");

  const [error,setError] = useState("");

  const sendCode = async ()=>{

    try{

      await requestRegisterCode(email);

      setStep(2);

    }catch{

      setError("No se pudo enviar el código");

    }

  };

  const handleRegister = async (e:React.FormEvent)=>{

    e.preventDefault();

    try{

      await registerUser({
        name,
        email,
        password,
        code
      });

      router.push("/login");

    }catch{

      setError("Código inválido");

    }

  };

  return(

    <div className="flex min-h-screen items-center justify-center bg-gray-100">

      <Card className="w-96 p-6 space-y-5">

        <h1 className="text-2xl font-bold text-center">
          Crear cuenta
        </h1>

        {step === 1 && (

          <div className="space-y-4">

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

            <Button
              onClick={sendCode}
              className="w-full"
            >
              Enviar código
            </Button>

          </div>

        )}

        {step === 2 && (

          <form
            onSubmit={handleRegister}
            className="space-y-4"
          >

            <Input
              placeholder="Código de verificación"
              value={code}
              onChange={(e)=>setCode(e.target.value)}
            />

            <Button className="w-full">
              Crear cuenta
            </Button>

          </form>

        )}

        {error && (
          <p className="text-red-500 text-sm text-center">
            {error}
          </p>
        )}

        <p className="text-sm text-center">

          ¿Ya tienes cuenta?{" "}
          <Link
            href="/login"
            className="text-blue-600"
          >
            Inicia sesión
          </Link>

        </p>

      </Card>

    </div>

  );

}