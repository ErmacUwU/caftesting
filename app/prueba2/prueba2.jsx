"use client";
import React, { useState, useEffect } from "react";
import TarjetaTerapeuta from '../components/TarjetaTerapeuta'
import { useAuth } from "../context/AuthContext.js"; 
import { useRouter } from "next/navigation";

const Terapeutas = () => {

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
      <TarjetaTerapeuta/>
    </div>
  )
}

export default Terapeutas
