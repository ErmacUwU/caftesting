'use client';

import React from 'react';


const Page = () => {
  return (
    <div className="h-screen w-full bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] text-white flex flex-col">
     

      <div className="flex-1 p-6 max-w-4xl mx-auto">
        <div className="bg-[#1a1a2e] p-6 rounded-xl shadow-lg">
          <h3 className="text-2xl font-semibold text-white mb-4 text-center">
            SISTEMA DE PRUEBA DE FUNCIONALIDADES PARA CAF
          </h3>

          <p className="text-white/80 leading-relaxed">
            Aquí estoy probando todas las funcionalidades que se planean usar en el programa de CAF, desde el nav hasta el calendario, formularios, etcétera.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Page;
