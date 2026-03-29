"use client";

import { useState, useEffect } from "react";
import { loginUser } from "@/src/services/auth.service";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/context/AuthContext";
import Link from "next/link";
import { startAuthentication } from "@simplewebauthn/browser";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import api from "@/src/services/api";

export default function LoginPage() {

  const router = useRouter();
  const { login, user } = useAuth();

  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [error,setError] = useState("");

  useEffect(() => {

    if(user){
      router.push("/dashboard");
    }

  },[user,router]);

  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault();
    setError("");

    try {

      const data = await loginUser({
        email,
        password
      });

      login(data.token);

      router.push("/dashboard");

    } catch {

      setError("Credenciales inválidas");

    }

  };

  const handleBiometricLogin = async () => {

    try {

      if (!email) {
        setError("Ingresa tu email primero");
        return;
      }

      // 1. pedir opciones al backend
      const { data: options } = await api.post(
        "/webauthn/login/options",
        { email }
      );

      // 2. lanzar biometría (FaceID / huella)
      const credential = await startAuthentication(options);

      // 3. enviar al backend para verificar
      const { data } = await api.post(
        "/webauthn/login/verify",
        {
          email,
          credential
        }
      );

      // 4. login normal
      login(data.token);
      router.push("/dashboard");

    } catch (err) {

      console.error(err);
      setError("Error con biometría");

    }

  };

  return (

    <div className="flex min-h-screen items-center justify-center bg-gray-100">

      <Card className="w-96 p-6 space-y-5">

        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold">
            Iniciar sesión
          </h1>

          <p className="text-sm text-gray-500">
            Accede a tu cuenta para comenzar a chatear
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >

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
            Iniciar sesión
          </Button>

          <Button
            type="button"
            onClick={handleBiometricLogin}
            className="w-full bg-black text-white"
          >
            Iniciar con biometría
          </Button>

        </form>

        <p className="text-sm text-center text-gray-600">

          ¿No tienes cuenta?{" "}
          <Link
            href="/register"
            className="text-blue-600 hover:underline"
          >
            Regístrate
          </Link>

        </p>

      </Card>

    </div>

  );

}