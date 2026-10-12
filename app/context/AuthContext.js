'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext();

const clearStoredSession = () => {
  localStorage.removeItem('isAuthenticated');
  localStorage.removeItem('userId');
  localStorage.removeItem("userName");
  localStorage.removeItem("userRole");
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // ⬅ Estado para evitar redirección prematura
  const [userName, setUserName] = useState("")
  const [userRole, setUserRole] = useState("")
  const router = useRouter();


  useEffect(() => {
    // Las cookies de sesión (las que revisa el middleware) caducan a las 24h,
    // pero localStorage no. Si la cookie ya no existe, la sesión guardada en
    // localStorage es vieja: se descarta para que la app no "crea" que hay
    // sesión mientras el middleware rebota a /login (ciclo de login en
    // /registroU).
    const hasSessionCookie = document.cookie
      .split("; ")
      .some((c) => c.startsWith("userRole=") && c.length > "userRole=".length);
    if (!hasSessionCookie) {
      clearStoredSession();
      setIsLoading(false);
      return;
    }

    const storedAuth = localStorage.getItem('isAuthenticated');
    const storedUserId = localStorage.getItem('userId');
    const storedName = localStorage.getItem("userName");
    const storedRole = localStorage.getItem("userRole")


    if (storedRole) setUserRole(storedRole)

    if (storedAuth === 'true' && storedUserId) {
      setIsAuthenticated(true);
      setUserId(storedUserId);
    }
    
    if (storedName) setUserName(storedName);
    setIsLoading(false);
  }, []);


  const login = (id, name, role, redirectTo = '/') => {
    console.log("🔐 Login con:", id, name, role);
    setIsAuthenticated(true);
    setUserId(id);
    setUserName(name)
    setUserRole(role)
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('userId', id);
    localStorage.setItem('userName', name);
    localStorage.setItem("userRole", role)
    router.replace(redirectTo); // ⬅ Evita que el usuario regrese al login después de autenticarse
  };

  const logout = async () => {
    setIsAuthenticated(false);
    setUserId(null);
    setUserName("")
    setUserRole("")
    clearStoredSession();
    // Sin esto las cookies seguían vivas y el middleware quedaba desfasado
    // respecto a la sesión del cliente.
    try {
      await fetch('/api/logout', { method: 'POST' });
    } catch (error) {
      console.error("Error al cerrar sesión en el servidor:", error);
    }
    router.replace('/login');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, userId, userName, userRole, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};
