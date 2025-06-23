'use client'

import TarjetaCitas from '../components/TarjetaCitas';
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.js"; 
import { useRouter } from "next/navigation";


const Agendas = () => {

  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
      }
    }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return <p>Cargando...</p>;
  }

  if (!isAuthenticated) {
    return null; 
  }
  

  return (
    <div className="container mx-auto p-6 bg-gray-100 rounded-lg shadow-md">
      <h1 className='text-2xl font-bold text-center mb-4 text-gray-800'>Citas Agendadas</h1>
      
      <div className="bg-white p-4 rounded-md shadow-sm mb-6">
        <TarjetaCitas />
      </div>

      <div className="text-center">
        <p className="text-lg text-gray-600">CRUD para las citas</p>
      </div>
    </div>
  );
}

export default Agendas;