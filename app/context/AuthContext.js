'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Importa useRouter para manejar redirecciones.

// Crea el contexto de autenticación.
const AuthContext = createContext();

// Proveedor del contexto de autenticación.
export const AuthProvider = ({ children }) => {
  // Estado para manejar si el usuario está autenticado.
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState(null); // ID del usuario autenticado
  const router = useRouter(); // Hook para manejar la navegación en Next.js.

  // Efecto que carga la información de autenticación desde localStorage al iniciar la aplicación.
  useEffect(() => {
    // Obtiene el estado de autenticación y el ID del usuario desde localStorage.
    const storedAuth = localStorage.getItem('isAuthenticated');
    const storedUserId = localStorage.getItem('userId');

    // Si los datos existen y el usuario está autenticado, actualiza los estados correspondientes.
    if (storedAuth === 'true' && storedUserId) {
      setIsAuthenticated(true);
      setUserId(storedUserId);
    }
  }, []);

  // Función para manejar el inicio de sesión.
  const login = (id) => {
    setIsAuthenticated(true); // Marca al usuario como autenticado.
    setUserId(id); // Almacena el ID del usuario autenticado.
    localStorage.setItem('isAuthenticated', 'true'); // Guarda el estado de autenticación en localStorage.
    localStorage.setItem('userId', id); // Guarda el ID del usuario en localStorage.
    router.push('/'); // Redirige al usuario a la página principal.
  };

  // Función para manejar el cierre de sesión.
  const logout = () => {
    setIsAuthenticated(false); // Marca al usuario como no autenticado.
    setUserId(null); // Limpia el ID del usuario.
    localStorage.removeItem('isAuthenticated'); // Elimina el estado de autenticación de localStorage.
    localStorage.removeItem('userId'); // Elimina el ID del usuario de localStorage.
    router.push('/login'); // Redirige al usuario a la página de inicio de sesión.
  };

  // Retorna el proveedor del contexto con los valores necesarios disponibles para los componentes hijos.
  return (
    <AuthContext.Provider value={{ isAuthenticated, userId, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar el contexto de autenticación.
export const useAuth = () => {
  // Obtiene el contexto actual.
  const context = useContext(AuthContext);
  // Lanza un error si el hook se utiliza fuera del proveedor del contexto.
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  // Retorna el contexto.
  return context;
};
