'use client'
import React, { useState, useEffect } from "react";
import BotonDeleteTerapeuta from "./BotonDeleteTerapeuta";

const TarjetaTerapeuta = () => {
  const [therapist, setTherapist] = useState([]);

  useEffect(() => {
    const getTherapists = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/therapist", {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error("Failed to fetch therapists");
        }

        const data = await res.json();
        setTherapist(data.therapist || []); // Assuming your API response has an object with 'therapist' array
      } catch (error) {
        console.error("Error fetching therapists:", error);
        setTherapist([]); // Set empty array on error
      }
    };

    getTherapists();
  }, []);

  return (
    <div>
      <h1>Lista de Terapeutas</h1>
      {therapist.map((t) => (
        <div
          key={t._id}
          className="p-4 border border-slate-300 my-3 flex justify-between gap-5 items-start"
        >
          <div>
            <div>ID: {t.idTherapist}</div>
            <div>
              Nombre: {t.firstName} {t.lastName}
            </div>
            <div>Especialidad: {t.specialization}</div>
            <div>Celular: {t.phone}</div>
            <div>Email: {t.email}</div>
            <div className="py-2"><BotonDeleteTerapeuta id={t._id}/></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TarjetaTerapeuta;
