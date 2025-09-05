'use client';

import React from 'react';
import Image from 'next/image';
import child from './assets/images/bby.webp';

const Page = () => {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] text-white flex items-center justify-center px-4 py-10">
      <div className="max-w-6xl w-full grid md:grid-cols-2 gap-12 items-center">
        
        {/* Sección izquierda: texto + botón */}
        <div className="space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">
            Centro de Apoyo a la Familia
          </h1>
          <p className="text-lg md:text-xl text-white/80">
            Diagnóstico y acompañamiento terapéutico en lenguaje, psicología y aprendizaje para niños con Autismo, Déficit de atención, deficiencia intelectual y más.
          </p>
          <button className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-xl shadow-lg transition">
            Agenda tu cita
          </button>
        </div>

        {/* Sección derecha: imagen gráfica */}
        <div className="flex justify-center">
          <Image
            src={child}
            alt="Ilustración gráfica"
            className="w-full max-w-md rounded-xl shadow-2xl"
          />
        </div>
      </div>
    </div>
  );
};

export default Page;