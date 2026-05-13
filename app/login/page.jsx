'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js'; 
import { useRouter } from 'next/navigation'; 
import Image from 'next/image';
import child from '../assets/images/bby.webp';
import '../globals.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const router = useRouter();
  const [redirectTo, setRedirectTo] = useState("/");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get("redirect");
      if (redirect) {
        setRedirectTo(redirect);
      }
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Limpiar errores previos

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // 1. Actualizamos el Contexto de Autenticación
        // Usamos exactamente lo que el backend de UserTrue nos devuelve
        login(data.userId, data.userName, data.role);

        // 2. Persistencia manual (Solo si tu AuthContext no lo hace ya internamente)
        if (typeof window !== "undefined") {
          localStorage.setItem("isAuthenticated", "true");
          localStorage.setItem("userId", data.userId);
          localStorage.setItem("userName", data.userName);
          localStorage.setItem("userRole", data.role);
        }

        // 3. Redirección
        router.replace(redirectTo);
      } else {
        // AJUSTE: El backend ahora envía el error en 'msg', no en 'message'
        setError(data.msg || 'Error al iniciar sesión');
      }
    } catch (err) {
      console.error("Login Client Error:", err);
      setError('Error al conectarse al servidor');
    }
  };

  return (
    <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]">
      <form
        onSubmit={handleSubmit}
        className="p-10 rounded-2xl shadow-lg w-full max-w-md text-white bg-[#1a1a2e]"
      >
        <div className="flex justify-center mb-6">
          <Image src={child} alt="Login Image" width={100} height={100} className="rounded-full object-cover border-2 border-purple-500" />
        </div>

        <h1 className="text-3xl font-semibold mb-6 text-center">Bienvenido</h1>
        
        {/* Mostramos el error si existe */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-100 text-xs p-3 rounded-lg mb-4 text-center">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-3 rounded-lg bg-[#2c2c54] placeholder-zinc-400 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-3 rounded-lg bg-[#2c2c54] placeholder-zinc-400 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
          />
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-blue-700 hover:from-purple-700 hover:to-blue-800 transition duration-300 text-white p-3 rounded-lg font-semibold shadow-lg active:scale-[0.98]"
          >
            Entrar
          </button>
        </div>
      </form>
    </div>
  );
};

export default Login;