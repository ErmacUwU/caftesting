"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";

import RegistroPaciente from "./RegistroPaciente";
import RegistroTerapeuta from "./RegistroTerapeuta";
import RegistroUsuarioSistema from "./RegistroUsuarioSistema";

export default function Registro() {
  const [tipoUsuario, setTipoUsuario] = useState("");
  const { isAuthenticated, isLoading, userRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) return <p className="text-center mt-10">Cargando...</p>;
  if (!isAuthenticated) return null;

  return (
    <div className="max-w-3xl mx-auto p-6">

      <h1 className="text-4xl font-bold text-center mb-6">
        Registro de Usuarios
      </h1>

      {/* Selector */}
      <select
        value={tipoUsuario}
        onChange={(e) => setTipoUsuario(e.target.value)}
        className="w-full border rounded px-3 py-2 mb-8"
      >
        <option value="">Selecciona tipo de registro</option>
        <option value="paciente">Paciente</option>
        <option value="terapeuta">Terapeuta</option>
        {userRole === "admin" && (
          <option value="sistema">Usuario del sistema</option>
        )}
      </select>

      {/* Formularios */}
      {tipoUsuario === "paciente" && <RegistroPaciente />}
      {tipoUsuario === "terapeuta" && <RegistroTerapeuta />}
      {tipoUsuario === "sistema" && userRole === "admin" && (
        <RegistroUsuarioSistema />
      )}
    </div>
  );
}
