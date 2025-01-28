'use client';

import React, { useState } from 'react';

const Signup = () => {

  // Función que se ejecuta al enviar el formulario de registro.
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Función que se ejecuta al enviar el formulario de registro.
  const handleSignup = async (e) => {
    e.preventDefault();

    // Valida que las contraseñas coincidan antes de enviar la solicitud.
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    try {
      // Realiza una solicitud HTTP POST al endpoint `/api/signup` para crear un nuevo usuario.
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userName, email, password }),
      });

      const data = await response.json();

      if (response.ok) {

        // Si el servidor devuelve una respuesta exitosa:
        setSuccess('Cuenta creada con éxito. Ahora puedes iniciar sesión.');
        setError('');
        setUserName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
      } else {
         // Si el servidor devuelve un error, muestra el mensaje proporcionado o un mensaje genérico.
        setError(data.message || 'Hubo un error al registrarte');
      }
    } catch (err) {
      setError('Hubo un error al conectarse al servidor');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form
        className="bg-white p-8 rounded-lg shadow-md w-96"
        onSubmit={handleSignup}
      >
        <h1 className="text-2xl font-bold mb-6 text-center">Regístrate</h1>
        {error && (
          <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
        )}
        {success && (
          <p className="text-green-500 text-sm mb-4 text-center">{success}</p>
        )}
        <input
          type="userName"
          placeholder="Usuario"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          required
          className="w-full p-3 mb-4 border rounded-md focus:outline-none focus:ring focus:ring-blue-300"
        />
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
          className="w-full p-3 mb-4 border rounded-md focus:outline-none focus:ring focus:ring-blue-300"
        />
        <input
          type="password"
          placeholder="Confirma tu contraseña"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="w-full p-3 mb-6 border rounded-md focus:outline-none focus:ring focus:ring-blue-300"
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 transition"
        >
          Registrarse
        </button>
        <div className="flex justify-end text-sm mt-5 mb-1">
          <span>
            ¿Ya tienes cuenta?{' '}
            <a href="/login" className="text-blue-500">
              Inicia sesión
            </a>
          </span>
        </div>
      </form>
    </div>
  );
};

export default Signup;
