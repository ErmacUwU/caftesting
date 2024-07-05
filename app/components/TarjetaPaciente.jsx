"use client";
import React, { useState, useEffect } from "react";
import BotonDeletePaciente from "./BotonDeletePaciente";

const TarjetaPaciente = () => {
  const [patient, setPatient] = useState([]);

  useEffect(() => {
    const getPatient = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/patient", {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error("Failed to fetch therapists");
        }

        const data = await res.json();
        setPatient(data.patient || []); // Assuming your API response has an object with 'patient' array
      } catch (error) {
        console.error("Error fetching therapists:", error);
        setPatient([]); // Set empty array on error
      }
    };

    getPatient();
  }, []);

  return (
    <div>
      <h1>Lista de Pacientes</h1>
      {patient.map((p) => (
        <div
          key={p._id}
          className="p-4 border border-slate-300 my-3 flex justify-between gap-5 items-start"
        >
          <div>
            <div>ID: {p.idPatient}</div>
            <div>
              Nombre: {p.firstName} {p.lastName}
            </div>
            <div>Estatus del Paciente: {p.patientStatus}</div>
            <div>Nacionalidad: {p.nationality}</div>
            <div className="py-2">
              <BotonDeletePaciente id={p._id} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TarjetaPaciente;
