import React from 'react';
import Link from 'next/link';
import Sidebar from '@/app/sidebar/sidebar';

const Page = () => {
  return (
    <div className="flex h-screen">
      <div className="flex-1 p-6">
        <h3 className='mx-auto bg-slate-500 flex items-center p-4 text-white text-xl'>
          SISTEMA DE PRUEBA DE FUNCIONALIDADES PARA CAF
        </h3>
        
        <p className="mt-4">
          Aqui estoy probando todas las funcionalidades que se planean usar en el programa de CAF, desde el nav hasta el calendario, formularios, etcetera.
        </p>
      </div>
    </div>
  );
}

export default Page;
