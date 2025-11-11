'use client'

import TarjetaCitas from '../components/TarjetaCitas';
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.js"; 
import { useRouter } from "next/navigation";

const Agendas = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-gray-600 text-sm">Cargando...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-sky-50 to-slate-100 py-10">
      <main className="max-w-5xl mx-auto px-4">
        {/* Encabezado */}
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            Citas Agendadas
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Visualiza, administra y gestiona las citas registradas en el sistema CAF.
          </p>
        </header>

        {/* Contenedor principal de la tarjeta */}
        <section className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-md border border-slate-100 p-5 sm:p-6 md:p-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">
                Panel de citas
              </h2>
              <p className="text-xs text-slate-500">
                Aquí puedes consultar las citas existentes y editar su información.
              </p>
            </div>
            <span className="inline-flex items-center rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700 border border-sky-100">
              CRUD de citas
            </span>
          </div>

          <div className="mt-4 bg-slate-50/60 rounded-xl p-3 sm:p-4">
            <TarjetaCitas />
          </div>
        </section>

        {/* Pie / nota */}
        <footer className="mt-6 text-center">
          <p className="text-xs text-slate-400">
            Módulo de agendas · Sistema CAF
          </p>
        </footer>
      </main>
    </div>
  );
}

export default Agendas;
