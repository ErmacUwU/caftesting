import React from 'react'
import Link from 'next/link';
const registropaciente = () => {

    
  return (
    
    <form className="max-w-md mx-auto p-4 bg-gray-100">
        <h1 className='text-black font-extrabold'>REGISTRO DE PACIENTES</h1>
      <div className="mb-4">
        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
          Nombre<span className="text-red-600">*</span>
        </label>
        <input
          type="text"
          id="firstName"
          name="firstName"
          className="w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 text-black"
          placeholder="Escribe el nombre del paciente"
          required
        />
      </div>

      <div className="mb-4">
        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
          Apellidos<span className="text-red-600">*</span>
        </label>
        <input
          type="text"
          id="lastName"
          name="lastName"
          className="w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 text-black"
          placeholder="Escribe los apellidos del paciente"
          required
        />
      </div>

      <div className="mb-4">
        <label htmlFor="birthdate" className="block text-sm font-medium text-gray-700">
          Fecha de nacimiento<span className="text-red-600">*</span> (DD/MM/AAAA)
        </label>
        <input
          type="text"
          id="birthdate"
          name="birthdate"
          className="w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 text-black"
          placeholder="DD/MM/AAAA"
          required
        />
      </div>

      <div className="mb-4">
        <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
          Género<span className="text-red-600">*</span> (M o F)
        </label>
        <input
          type="text"
          id="gender"
          name="gender"
          className="w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 text-black"
          placeholder="M o F"
          required
        />
      </div>

      <div className="mb-4">
        <label htmlFor="id" className="block text-sm font-medium text-gray-700">
          ID (identificador único del sistema)
        </label>
        <input
          type="text"
          id="id"
          name="id"
          className="w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 text-black"
          placeholder="Ingrese el ID del paciente"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="patientStatus" className="block text-sm font-medium text-gray-700">
          Estado del paciente<span className="text-red-600">*</span>
        </label>
        <select
          id="patientStatus"
          name="patientStatus"
          className="w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 text-black"
          defaultValue="activo"
          required
        >
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </select>
      </div>

      <div className="mb-4">
        <label htmlFor="birthCity" className="block text-sm font-medium text-gray-700">
          Ciudad de nacimiento
        </label>
        <input
          type="text"
          id="birthCity"
          name="birthCity"
          className="w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 text-black"
          placeholder="Ingrese la ciudad de nacimiento del paciente"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="nationality" className="block text-sm font-medium text-gray-700">
          Nacionalidad
        </label>
        <input
          type="text"
          id="nationality"
          name="nationality"
          className="w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 text-black"
          placeholder="Ingrese la nacionalidad del paciente"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="birthState" className="block text-sm font-medium text-gray-700">
          Estado de nacimiento
        </label>
        <input
          type="text"
          id="birthState"
          name="birthState"
          className="w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 text-black"
          placeholder="Ingrese el estado de nacimiento del paciente"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="idType" className="block text-sm font-medium text-gray-700">
          Tipo de identificación
        </label>
        <input
          type="text"
          id="idType"
          name="idType"
          className="w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 text-black"
          placeholder="Ingrese el tipo de identificación del paciente"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="consent" className="flex items-center">
          <input
            type="checkbox"
            id="consent"
            name="consent"
            className="form-checkbox h-5 w-5 text-indigo-600 rounded-md focus:ring-indigo-500"
          />
          <span className="ml-2 text-sm text-gray-700">Consentimiento para el tratamiento de sus datos para fines sanitarios firmado</span>
        </label>
      </div>

      <div className="mt-4">
        <button
          type="submit"
          className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Guardar
        </button>
      </div>
    </form>
  )
}

export default registropaciente;