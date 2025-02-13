"use client";
import React, { useState, useEffect } from "react";
import TarjetaTerapeuta from '../components/TarjetaTerapeuta'
import { useAuth } from "../context/AuthContext.js"; 
import { useRouter } from "next/navigation";

const Terapeutas = () => {

    const { isAuthenticated } = useAuth(); // Obtiene el estado de autenticación
    const router = useRouter(); // Hook para manejar redirecciones.
  
    // Redirige al login si no está autenticado
    useEffect(() => {
      if (!isAuthenticated) {
        router.push("/login"); // Redirige a la página de inicio de sesión.
      }
    }, [isAuthenticated, router]);
  
    // Evita que se muestre contenido mientras redirige
    if (!isAuthenticated) {
      return null;
    }

  return (
    <div>
      <TarjetaTerapeuta/>
    </div>
  )
}

export default Terapeutas
