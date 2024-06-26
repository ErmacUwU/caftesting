import React from 'react'

const registroTerapeuta = () => {
  return (
    <form className="max-w-md mx-auto p-4 bg-gray-100">
        <h1 className='text-black font-extrabold'>REGISTRO DE TERAPEUTAS</h1>
      <div className="mb-4">
        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
          Nombre<span className="text-red-600">*</span>
        </label>
        <input
          type="text"
          id="firstName"
          name="firstName"
          className="w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 text-black"
          placeholder="Escribe el nombre del terapeuta"
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
          placeholder="Escribe los apellidos del terapeuta"
          required
        />
      </div>

      <div className="mb-4">
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Correo electrónico<span className="text-red-600">*</span>
        </label>
        <input
          type="email"
          id="email"
          name="email"
          className="w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 text-black"
          placeholder="Escribe el correo electrónico del terapeuta"
          required
        />
      </div>

      <div className="mb-4">
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
          Teléfono<span className="text-red-600">*</span>
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          className="w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 text-black"
          placeholder="Escribe el teléfono del terapeuta"
          required
        />
      </div>

      <div className="mb-4">
        <label htmlFor="specialization" className="block text-sm font-medium text-gray-700">
          Especialización
        </label>
        <input
          type="text"
          id="specialization"
          name="specialization"
          className="w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 text-black"
          placeholder="Escribe la especialización del terapeuta"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="address" className="block text-sm font-medium text-gray-700">
          Dirección
        </label>
        <input
          type="text"
          id="address"
          name="address"
          className="w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 text-black"
          placeholder="Escribe la dirección del terapeuta"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="city" className="block text-sm font-medium text-gray-700">
          Ciudad
        </label>
        <input
          type="text"
          id="city"
          name="city"
          className="w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 text-black"
          placeholder="Escribe la ciudad del terapeuta"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="country" className="block text-sm font-medium text-gray-700">
          País
        </label>
        <input
          type="text"
          id="country"
          name="country"
          className="w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 text-black"
          placeholder="Escribe el país del terapeuta"
        />
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

export default registroTerapeuta