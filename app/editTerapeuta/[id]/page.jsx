'use client';
import { useEffect, useState } from "react";
import ActualizarTerapeuta from "@/app/components/ActualizarTerapeuta";

const UpdateTherapist = ({ params }) => {
  const { id } = params;
  const [therapistData, setTherapistData] = useState(null);

  useEffect(() => {
    const getTherapistById = async () => {
      try {
        const res = await fetch(`/api/therapist/${id}`, { cache: "no-store" });

        if (!res.ok) {
          throw new Error("Failed to fetch therapist");
        }

        const data = await res.json();
        setTherapistData(data.therapist);
      } catch (error) {
        console.error("Error fetching therapist:", error);
      }
    };

    getTherapistById();
  }, [id]);

  if (!therapistData) {
    return <p>Cargando datos...</p>;
  }

  return (
    <ActualizarTerapeuta
      id={id}
      firstName={therapistData.firstName}
      lastName={therapistData.lastName}
      email={therapistData.email}
      phone={therapistData.phone}
      specialization={therapistData.specialization}
      address={therapistData.address}
      city={therapistData.city}
      country={therapistData.country}
    />
  );
};

export default UpdateTherapist;
