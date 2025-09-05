'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // ⬅ Estado para evitar redirección prematura
  const [userName, setUserName] = useState("")
  const [userRole, setUserRole] = useState("")
  const router = useRouter();


  useEffect(() => {
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


  const login = (id, name, role) => {
    console.log("🔐 Login con:", id, name, role);
    setIsAuthenticated(true);
    setUserId(id);
    setUserName(name)
    setUserRole(role)
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('userId', id);
    localStorage.setItem('userName', name);
    localStorage.setItem("userRole", role)
    router.replace('/'); // ⬅ Evita que el usuario regrese al login después de autenticarse
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUserId(null);
    setUserName("")
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userId');
    localStorage.removeItem("userName");
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
