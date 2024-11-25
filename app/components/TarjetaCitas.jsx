'use client'
import React, { useEffect, useState } from 'react';
import Link from "next/link";
import { PenBoxIcon } from "lucide-react";
import BotonDeleteCitas from './BotonDeleteCitas';

const TarjetaCitas = () => {
  const [dates, setDates] = useState([]);
  const [filteredDates, setFilteredDates] = useState([]);
  const [therapists, setTherapists] = useState([]);
  const [patients, setPatients] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedTherapist, setSelectedTherapist] = useState('');
  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    const getDates = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/date", {
          cache: "no-store"
        });

        if (!res.ok) {
          throw new Error("Failed to fetch date");
        }

        const data = await res.json();
        setDates(data.date || []);
        setFilteredDates(data.date || []);

        const uniqueTherapists = [...new Set(data.date.map(d => d.therapist))];
        const uniquePatients = [...new Set(data.date.map(d => d.patient))];
        const uniqueServices = [...new Set(data.date.map(d => d.description))];

        setTherapists(uniqueTherapists);
        setPatients(uniquePatients);
        setServices(uniqueServices);

      } catch (error) {
        console.error("Error fetching dates:", error);
        setDates([]);
        setFilteredDates([]);
      }
    };

    getDates();
  }, []);

  const handleTherapistChange = (event) => setSelectedTherapist(event.target.value);
  const handlePatientChange = (event) => setSelectedPatient(event.target.value);
  const handleServiceChange = (event) => setSelectedService(event.target.value);

  const handleDateChange = (event) => {
    const selectedDateISO = new Date(event.target.value).toISOString().split("T")[0]; // Solo la fecha en formato ISO
    setSelectedDate(selectedDateISO);
  };

  useEffect(() => {
    const filtered = dates.filter((d) => {
      const appointmentDate = new Date(d.date).toISOString().split("T")[0]; // Solo la fecha en formato ISO
      return (selectedTherapist === '' || d.therapist === selectedTherapist) &&
             (selectedPatient === '' || d.patient === selectedPatient) &&
             (selectedService === '' || d.description === selectedService) &&
             (selectedDate === '' || appointmentDate === selectedDate);
    });
    setFilteredDates(filtered);
  }, [selectedTherapist, selectedPatient, selectedService, selectedDate, dates]);

  const formatToLocalDate = (dateString) => {
    const [year, month, day] = dateString.split("T")[0].split("-");
    const localDate = new Date(year, month - 1, day); // Mes en JavaScript empieza desde 0
    return localDate.toLocaleDateString("es-ES", { timeZone: "America/Tijuana" });
  };
  

  const formatToLocalTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: "America/Tijuana" });
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Filtrar Citas</h2>
      
      {/* Filtro de terapeuta */}
      <div className="mb-4">
        <label className="block mb-1 font-semibold">Filtrar por terapeuta:</label>
        <select 
          value={selectedTherapist} 
          onChange={handleTherapistChange} 
          className="border border-gray-400 rounded-md p-2 w-full"
        >
          <option value="">Todos</option>
          {therapists.map((therapist) => (
            <option key={therapist} value={therapist}>
              {therapist}
            </option>
          ))}
        </select>
      </div>

      {/* Filtro de paciente */}
      <div className="mb-4">
        <label className="block mb-1 font-semibold">Filtrar por paciente:</label>
        <select 
          value={selectedPatient} 
          onChange={handlePatientChange} 
          className="border border-gray-400 rounded-md p-2 w-full"
        >
          <option value="">Todos</option>
          {patients.map((patient) => (
            <option key={patient} value={patient}>
              {patient}
            </option>
          ))}
        </select>
      </div>

      {/* Filtro de servicio */}
      <div className="mb-4">
        <label className="block mb-1 font-semibold">Filtrar por servicio:</label>
        <select 
          value={selectedService} 
          onChange={handleServiceChange} 
          className="border border-gray-400 rounded-md p-2 w-full"
        >
          <option value="">Todos</option>
          {services.map((service) => (
            <option key={service} value={service}>
              {service}
            </option>
          ))}
        </select>
      </div>

      {/* Filtro de fecha */}
      <div className="mb-4">
        <label className="block mb-1 font-semibold">Fecha Única:</label>
        <input 
          type="date" 
          value={selectedDate} 
          onChange={handleDateChange} 
          className="border border-gray-400 rounded-md p-2 w-full"
        />
      </div>

      {/* Renderizamos las citas filtradas */}
      {filteredDates.map((d) => {
        const formattedDate = formatToLocalDate(d.date);
        const formattedStart = formatToLocalTime(d.start);
        const formattedEnd = formatToLocalTime(d.end);

        return (
          <div
            key={d._id}
            className="p-4 border border-gray-300 rounded-md my-3 flex justify-between gap-5 items-start bg-gray-50 shadow-sm"
          >
            <div>
              <div className="font-semibold">{d.title}</div>
              <div>Terapeuta: {d.therapist}</div>
              <div>Paciente: {d.patient}</div>
              <div>Fecha: {formattedDate}</div>
              <div>Hora: {formattedStart} - {formattedEnd}</div>
            </div>
            <div className="flex justify-evenly py-2">
              <div>
                <button>
                    <PenBoxIcon size={24} color="blue" />
                </button>
              </div>
              <div>
                <BotonDeleteCitas id={d._id} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default TarjetaCitas;
