'use client';

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js'; // Importa el contexto de autenticación
import { useRouter } from 'next/navigation';

const Login = () => {

  // Estados locales para manejar los valores del formulario y los mensajes de error.

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth(); // Usa la función login del contexto
  const router = useRouter(); // Hook para redirigir al usuario después del inicio de sesión.


   // Función que se ejecuta al enviar el formulario.
  const handleSubmit = async (e) => {
    e.preventDefault(); // Evita el comportamiento predeterminado del formulario

    // Realiza una solicitud HTTP POST al backend para enviar las credenciales del usuario.
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }), // Envia las credenciales al servidor
      });

      const data = await response.json();

      if (response.ok) {
        // Llama al método login del contexto para manejar el estado de autenticación
        login(); // Actualiza el estado de autenticación en el contexto global.
        router.push('/'); // Redirige al usuario a la página principal
        alert('Inicio de Sesion Exitoso, Bienvenido')
      } else {
        setError(data.message || 'Error al iniciar sesión');
      }
    } catch (err) {
      console.error(err);
      setError('Error al conectarse al servidor');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg shadow-md w-96"
      >
        <h1 className="text-2xl font-bold mb-6 text-center">Iniciar Sesión</h1>
        {error && (
          <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
        )}
        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full p-3 mb-4 border rounded-md focus:outline-none focus:ring focus:ring-blue-300"
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full p-3 mb-6 border rounded-md focus:outline-none focus:ring focus:ring-blue-300"
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 transition"
        >
          Entrar
        </button>
      </form>
    </div>
  );
};

export default Login;
