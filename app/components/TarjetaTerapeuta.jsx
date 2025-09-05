'use client';
import React, { useState, useEffect } from "react";
import Link from "next/link";
import BotonDeleteTerapeuta from "./BotonDeleteTerapeuta";
import { PenBoxIcon } from "lucide-react";

const TarjetaTerapeuta = () => {
  const [therapist, setTherapist] = useState([]);

  useEffect(() => {
    const getTherapists = async () => {
      try {
        const res = await fetch("/api/therapist", { cache: "no-store" });

        if (!res.ok) {
          throw new Error("Failed to fetch therapists");
        }

        const data = await res.json();
        setTherapist(data.therapist || []);
      } catch (error) {
        console.error("Error fetching therapists:", error);
        setTherapist([]);
      }
    };

    getTherapists();
  }, []);

  return (
    <div className="p-6 bg-gray-50">
      <h1 className="text-2xl font-extrabold text-center text-gray-800 mb-6">Nuestros Terapeutas</h1>
      {therapist.map((t) => (
        <div
          key={t._id}
          className="p-5 bg-white rounded-lg shadow-md border border-gray-200 my-4 flex flex-col md:flex-row gap-6 items-start"
        >
          <div className="w-full md:w-2/3">
            <div className="text-lg font-semibold text-gray-700">
              {t.firstName} {t.lastName}
            </div>
            <div className="text-sm text-gray-500">Especialidad: <span className="font-medium text-gray-700">{t.specialization}</span></div>
            <div className="text-sm text-gray-500">Celular: <span className="font-medium text-gray-700">{t.phone}</span></div>
            <div className="text-sm text-gray-500">Email: <span className="font-medium text-gray-700">{t.email}</span></div>
          </div>

          <div className="flex gap-4 mt-4 md:mt-0 justify-center md:justify-start items-center w-full md:w-auto">
            <Link href={`/editTerapeuta/${t._id}`} passHref>
              <button
                className="text-blue-600 hover:text-blue-800 transition duration-200"
                aria-label={`Editar terapeuta ${t.firstName} ${t.lastName}`}
              >
                <PenBoxIcon size={24} />
              </button>
            </Link>
            <BotonDeleteTerapeuta id={t._id} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default TarjetaTerapeuta;
