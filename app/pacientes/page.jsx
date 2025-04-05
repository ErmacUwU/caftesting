"use client";
import React, { useState, useEffect } from "react";
import TarjetaPaciente from '../components/TarjetaPaciente'
import { useAuth } from "../context/AuthContext.js"; 
import { useRouter } from "next/navigation";

const Pacientes = () => {

  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

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
   <div>
    <TarjetaPaciente/>
   </div>
    
  )
}

export default Pacientes