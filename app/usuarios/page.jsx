'use client'

import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.js"; 
import { useRouter } from "next/navigation";


const Usuarios = () => {

  const { isAuthenticated } = useAuth(); // Obtiene el estado de autenticación
  const router = useRouter(); // Hook para manejar redirecciones.
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login'); // ⬅ Redirige solo si no está autenticado
      }
    }, [isAuthenticated, isLoading, router]);

    if (isLoading) {
      return <p>Cargando...</p>; // ⬅ Muestra un loader en lugar de redirigir inmediatamente
    }
  
    if (!isAuthenticated) {
      return null; // ⬅ Evita mostrar contenido mientras se redirige
    }

  return (
    <div>Usuarios</div>
  )
}

export default Usuarios