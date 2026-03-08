"use client";

import { createContext, useContext, useEffect, useState } from "react";
import api from "@/src/services/api";
import { connectSocket, getSocket } from "@/src/services/socket.service";

type User = {
  id: string;
  name: string;
  email: string;
  profile_picture_url?: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (token: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {

  const [user,setUser] = useState<User | null>(null);
  const [loading,setLoading] = useState(true);

  const fetchUser = async () => {

    try {

      const res = await api.get("/users/me");

      setUser(res.data);

    } catch (err) {

      localStorage.removeItem("token");
      setUser(null);

    }

    setLoading(false);

  };

  useEffect(() => {

    const token = localStorage.getItem("token");

    if(token){
      fetchUser();
    }else{
      setLoading(false);
    }

  },[]);

  useEffect(() => {

    if(!user) return;

    connectSocket(user.id);

  },[user]);

  const login = (token:string) => {

    localStorage.setItem("token",token);

    fetchUser();

  };

  const logout = () => {

    try{

      const socket = getSocket();
      socket.disconnect();

    }catch(e){}

    localStorage.removeItem("token");

    setUser(null);

  };

  return(

    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout
      }}
    >

      {children}

    </AuthContext.Provider>

  );

};

export const useAuth = () => {

  const context = useContext(AuthContext);

  if(!context){
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;

};