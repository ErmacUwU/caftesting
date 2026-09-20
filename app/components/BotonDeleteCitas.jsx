"use client";

import React, { useState } from "react";

const BotonDeleteCitas = ({ id, recurrenceGroupId, onDeleted }) => {
  const [isChoiceOpen, setIsChoiceOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const performDelete = async (mode) => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/date?id=${id}&mode=${mode}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setIsChoiceOpen(false);
        if (onDeleted) {
          onDeleted();
        } else {
          window.location.reload();
        }
      } else {
        alert("No se pudo eliminar la cita.");
      }
    } catch (error) {
      console.error("Error al eliminar la cita:", error);
      alert("Error al eliminar la cita.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteClick = () => {
    // Cita dentro de una serie recurrente: se ofrecen las 2 opciones (estilo Doctoralia)
    if (recurrenceGroupId) {
      setIsChoiceOpen(true);
      return;
    }

    // Cita individual: confirmación estándar de siempre
    const confirmed = confirm("¿Esta seguro de borrarlo?");
    if (confirmed) {
      performDelete("single");
    }
  };

  return (
    <div>
      <button
        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition disabled:opacity-50"
        onClick={handleDeleteClick}
        disabled={isDeleting}
      >
        Borrar Cita
      </button>

      {isChoiceOpen && (
        <div className="fixed inset-0 z-[2200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-2">
              Cita recurrente
            </h3>
            <p className="text-sm text-slate-500 mb-5">
              Esta cita pertenece a una serie de citas recurrentes. ¿Qué deseas eliminar?
            </p>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => performDelete("single")}
                disabled={isDeleting}
                className="w-full text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg transition disabled:opacity-50"
              >
                Borrar solo esta cita
              </button>
              <button
                type="button"
                onClick={() => performDelete("future_series")}
                disabled={isDeleting}
                className="w-full text-sm font-semibold bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg transition disabled:opacity-50"
              >
                Borrar esta y las siguientes citas futuras
              </button>
              <button
                type="button"
                onClick={() => setIsChoiceOpen(false)}
                disabled={isDeleting}
                className="w-full text-sm font-medium text-slate-500 hover:text-slate-700 py-2 disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BotonDeleteCitas;
