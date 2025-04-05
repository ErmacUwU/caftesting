'use client';
import { useEffect, useState } from "react";
import ActualizarPaciente from "@/app/components/ActualizarPaciente";

const UpdatePatient = ({ params }) => {
  const { id } = params;
  const [patientData, setPatientData] = useState(null);

  useEffect(() => {
    const getPatientById = async () => {
      try {
        const res = await fetch(`/api/patient/${id}`, { cache: "no-store" });

        if (!res.ok) {
          throw new Error("Failed to fetch patient");
        }

        const data = await res.json();
        setPatientData(data.patient);
      } catch (error) {
        console.error("Error fetching patient:", error);
      }
    };

    getPatientById();
  }, [id]);

  if (!patientData) {
    return <p>Cargando datos del paciente...</p>;
  }

  return (
    <ActualizarPaciente
      id={id}
      firstName={patientData.firstName}
      lastName={patientData.lastName}
      birthdate={patientData.birthdate}
      gender={patientData.gender}
      patientStatus={patientData.patientStatus}
      birthCity={patientData.birthCity}
      nationality={patientData.nationality}
      birthState={patientData.birthState}
      idType={patientData.idType}
      contacts={patientData.contacts}
    />
  );
};

export default UpdatePatient;
