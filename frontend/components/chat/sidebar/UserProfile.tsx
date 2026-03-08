"use client";

import { useAuth } from "@/src/context/AuthContext";
import Link from "next/link";

export default function UserProfile(){

  const { user, logout } = useAuth();

  if(!user) return null;

  return(

    <div className="p-4 border-b bg-white">

      <div className="flex items-center gap-3">

        <img
          src={user.profile_picture_url || "/avatar.png"}
          className="w-10 h-10 rounded-full object-cover"
        />

        <div className="flex flex-col">

          <span className="font-semibold text-sm">
            {user.name}
          </span>

          <span className="text-xs text-gray-500">
            {user.email}
          </span>

        </div>

      </div>

      <div className="flex justify-between mt-3 text-xs">

        <Link
          href="/settings"
          className="text-blue-600 hover:underline"
        >
          Configuración
        </Link>

        <button
          onClick={logout}
          className="text-red-500 hover:underline"
        >
          Cerrar sesión
        </button>

      </div>

    </div>

  )

}