'use client';

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js'; // Importa el contexto de autenticación
import { useRouter, useSearchParams } from 'next/navigation'; // Manejo de redirecciones y parámetros

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth(); // Usa la función login del contexto
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/"; // Obtiene la URL a la que debe redirigir tras el login

  // Función que se ejecuta al enviar el formulario
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Llama a login y actualiza el estado de autenticación
        login(data.userId); // Se pasa el `userId` del backend si está disponible
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("userId", data.userId); 

        alert('Inicio de Sesión Exitoso, Bienvenido');
        router.replace(redirectTo); // Redirige a la página protegida que intentó visitar
      } else {
        setError(data.message || 'Error al iniciar sesión');
      }
    } catch (err) {
      console.error(err);
      setError('Error al conectarse al servidor');
    }
  };

  return (
    <div className="flex justify-center bg-transparent">
      <form
        onSubmit={handleSubmit}
        className="bg-white bg-opacity-50 p-8 rounded-lg shadow-md w-96"
      >
        <h1 className="text-2xl font-bold mb-6 text-center">Bienvenido</h1>
        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full p-3 mb-4 border rounded-md text-black"
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full p-3 mb-6 border text-black"
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
