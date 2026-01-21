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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg font-medium">Cargando...</p>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const Card = ({ title, desc, value }) => (
    <button
      onClick={() => setTipoUsuario(value)}
      className={`p-6 rounded-xl border shadow-sm transition hover:shadow-md hover:-translate-y-1
        ${
          tipoUsuario === value
            ? "border-indigo-600 bg-indigo-50"
            : "bg-white"
        }`}
    >
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{desc}</p>
    </button>
  );

  return (
    <div className="min-h-screen bg-zinc-100 py-10 px-4">

      {/* Header */}
      <div className="max-w-4xl mx-auto text-center mb-10">
        <h1 className="text-4xl font-extrabold mb-2">
          Registro de Usuarios
        </h1>
        <p className="text-gray-600">
          Selecciona el tipo de usuario que deseas registrar
        </p>
      </div>

      {/* Selector Cards */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Card
          title="Paciente"
          desc="Registrar pacientes con información clínica y contactos"
          value="paciente"
        />

        <Card
          title="Terapeuta"
          desc="Registrar terapeutas y sus datos profesionales"
          value="terapeuta"
        />

        {userRole === "admin" && (
          <Card
            title="Usuario del Sistema"
            desc="Crear administradores u operadores"
            value="sistema"
          />
        )}
      </div>

      {/* Formulario */}
      {tipoUsuario && (
        <div className="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow-md transition-all">
          {tipoUsuario === "paciente" && <RegistroPaciente />}
          {tipoUsuario === "terapeuta" && <RegistroTerapeuta />}
          {tipoUsuario === "sistema" && userRole === "admin" && (
            <RegistroUsuarioSistema />
          )}
        </div>
      )}
    </div>
  );
}
