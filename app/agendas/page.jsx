'use client'

import TarjetaCitas from '../components/TarjetaCitas';
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.js"; 
import { useRouter } from "next/navigation";


const Agendas = () => {

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
    <div className="container mx-auto p-6 bg-gray-100 rounded-lg shadow-md">
      <h1 className='uppercase text-4xl font-bold text-center mb-6 text-gray-800'>Lista de Citas</h1>
      
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <TarjetaCitas />
      </div>

      <div className="text-center">
        <p className="text-lg text-gray-600">CRUD para las citas</p>
      </div>
    </div>
  );
}

export default Agendas;