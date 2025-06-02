'use client';
import React, { useState, useEffect } from "react";
import Link from "next/link";
import BotonDeletePaciente from "./BotonDeletePaciente";
import { PenBoxIcon } from "lucide-react";

const TarjetaPaciente = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getPatients = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/patient", { cache: "no-store" });

        if (!res.ok) {
          throw new Error("Failed to fetch patient");
        }

        const data = await res.json();
        setPatients(data.patient || []);
      } catch (error) {
        console.error("Error fetching patients:", error);
        setPatients([]);
      } finally {
        setLoading(false);
      }
    };

    getPatients();
  }, []);

  if (loading) {
    return <div className="text-center py-10">Cargando pacientes...</div>;
  }

  return (
    <div className="p-6 bg-gray-50">
      <h1 className="text-2xl font-extrabold text-center text-gray-800 mb-6">Nuestros Pacientes</h1>
      {patients.map((p) => (
        <div
          key={p._id}
          className="p-5 bg-white rounded-lg shadow-lg border border-gray-200 my-4 flex flex-col md:flex-row gap-6 items-start"
        >
          <div className="w-full md:w-2/3">
            <div className="text-lg font-semibold text-gray-700">
              {p.firstName} {p.lastName}
            </div>
            <div className="text-sm text-gray-500">
              ID: <span className="font-medium text-gray-700">{p.idPatient}</span>
            </div>
            <div className="text-sm text-gray-500">
              Estatus: <span className="font-medium text-gray-700">{p.patientStatus}</span>
            </div>
            <div className="text-sm text-gray-500">
              Nacionalidad: <span className="font-medium text-gray-700">{p.nationality}</span>
            </div>
          </div>

          <div className="flex gap-4 mt-4 md:mt-0 justify-center md:justify-start items-center w-full md:w-auto">
            <Link href={`/editPaciente/${p._id}`} passHref>
              <button
                className="text-blue-600 hover:text-blue-800 transition duration-200"
                aria-label={`Editar paciente ${p.firstName} ${p.lastName}`}
              >
                <PenBoxIcon size={24} />
              </button>
            </Link>
            <BotonDeletePaciente id={p._id} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default TarjetaPaciente;
