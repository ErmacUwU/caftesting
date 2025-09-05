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

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        login(data.userId, data.userName, data.role);
        if (typeof window !== "undefined") {
          localStorage.setItem("isAuthenticated", "true");
          localStorage.setItem("userId", data.userId);
          localStorage.setItem("userName", data.userName);
          localStorage.setItem("userRole", data.role);
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
    <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]">
      <form
        onSubmit={handleSubmit}
        className="p-10 rounded-2xl shadow-lg w-full max-w-md text-white bg-[#1a1a2e]"
      >
        <div className="flex justify-center mb-6">
          <Image src={child} alt="Login Image" width={100} height={100} className="rounded-full" />
        </div>

        <h1 className="text-3xl font-semibold mb-6 text-center">Bienvenido</h1>
        {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}

        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full p-3 mb-4 rounded-lg bg-[#2c2c54] placeholder-white text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full p-3 mb-6 rounded-lg bg-[#2c2c54] placeholder-white text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-purple-600 to-blue-700 hover:from-purple-700 hover:to-blue-800 transition duration-300 text-white p-3 rounded-lg font-semibold"
        >
          Entrar
        </button>
      </form>
    </div>
  );
};

export default Login;
