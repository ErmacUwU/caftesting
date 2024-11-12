import React from 'react';
import TarjetaCitas from '../components/TarjetaCitas';

const Agendas = () => {
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