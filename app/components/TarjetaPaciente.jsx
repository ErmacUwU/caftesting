"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import axios from "axios";
import BotonDeletePaciente from "./BotonDeletePaciente";
import { PenBoxIcon } from "lucide-react";

const TarjetaPaciente = () => {
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    const getPatients = async () => {
      try {
        const res = await axios.get("/api/patient",{
          mode: "no-cors",
        });
        setPatients(res.data.patient || []); // Ajusta 'patient' si la API tiene otro formato
      } catch (error) {
        console.error("Error al obtener pacientes:", error.message);
        setPatients([]); // En caso de error, inicializa con un array vacío
      }
    };

    getPatients();
  }, []);

  return (
    <div>
      <h1>Lista de Pacientes</h1>
      {patients.map((p) => (
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
            <div className="flex justify-evenly py-2">
              <div>
                <Link href={`/editPaciente/${p._id}`}>
                  <button>
                    <PenBoxIcon size={24} color="blue" />
                  </button>
                </Link>
              </div>
              <div>
                <BotonDeletePaciente id={p._id} />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TarjetaPaciente;
