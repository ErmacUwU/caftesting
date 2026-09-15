"use client";

import React from "react";

// Spinner liviano usado como fallback de Suspense/next-dynamic mientras
// cargan las vistas/componentes pesados (calendario, gráficas, exportación).
export default function Spinner({ label = "Cargando..." }) {
  return (
    <div className="w-full flex flex-col items-center justify-center gap-3 py-16">
      <div className="h-8 w-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      {label && <p className="text-xs text-slate-400">{label}</p>}
    </div>
  );
}
