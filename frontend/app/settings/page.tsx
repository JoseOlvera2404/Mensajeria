"use client";

import { useAuth } from "@/src/context/AuthContext";
import ProfileSection from "@/components/settings/ProfileSection";
import PasswordSection from "@/components/settings/PasswordSection";
import FriendsSection from "@/components/settings/FriendsSection";
import Link from "next/link";

export default function SettingsPage(){

  const { user } = useAuth();

  if(!user) return null;

  return(

    <div className="max-w-2xl mx-auto p-6 space-y-8">

      <div className="flex items-center gap-3">

        <Link
          href="/dashboard"
          className="text-sm text-blue-600 hover:underline"
        >
          ← Volver a conversaciones
        </Link>

      </div>

      <h1 className="text-2xl font-bold">
        Configuración
      </h1>

      <ProfileSection/>

      <PasswordSection/>

      <FriendsSection/>

    </div>

  );

}