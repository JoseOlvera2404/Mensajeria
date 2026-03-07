"use client";

export default function DashboardPage(){

  return(

    <div>

      <h1>Chat Dashboard</h1>

      <p>Usuario logueado</p>
      
      <button onClick={()=>{
        localStorage.removeItem("token");
        window.location.href = "/login";
      }}>
        Cerrar sesión
      </button>

      <p>Nuevo cambio</p>

    </div>

  )

}