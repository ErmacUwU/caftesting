'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js'; 
import { useRouter } from 'next/navigation'; 

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const router = useRouter();
  const [redirectTo, setRedirectTo] = useState("/");

  // Obtiene la URL de redirección después del login
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get("redirect");
      if (redirect) {
        setRedirectTo(redirect);
      }
    }
  }, []);

  // Función para manejar el login
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
        login(data.userId);
        
        // Guardar en localStorage solo en el cliente
        if (typeof window !== "undefined") {
          localStorage.setItem("isAuthenticated", "true");
          localStorage.setItem("userId", data.userId);
        }

        alert('Inicio de Sesión Exitoso, Bienvenido');
        router.replace(redirectTo);
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
