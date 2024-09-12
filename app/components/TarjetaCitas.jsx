'use client'
import React, { useEffect, useState } from 'react'

const TarjetaCitas = () => {
  const [dates, setDates] = useState([]);
  const [filteredDates, setFilteredDates] = useState([]);
  const [therapists, setTherapists] = useState([]); // Estado para los terapeutas únicos
  const [patients, setPatients] = useState([]); // Estado para los pacientes únicos
  const [services, setServices] = useState([]); // Estado para los servicios únicos
  const [selectedTherapist, setSelectedTherapist] = useState(''); // Estado para el terapeuta seleccionado
  const [selectedPatient, setSelectedPatient] = useState(''); // Estado para el paciente seleccionado
  const [selectedService, setSelectedService] = useState(''); // Estado para el servicio seleccionado

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
        setFilteredDates(data.date || []); // Inicializamos las citas filtradas con todas

        // Extraer listas únicas de terapeutas, pacientes y servicios
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

  // Manejar cambios en los filtros
  const handleTherapistChange = (event) => {
    setSelectedTherapist(event.target.value);
  };

  const handlePatientChange = (event) => {
    setSelectedPatient(event.target.value);
  };

  const handleServiceChange = (event) => {
    setSelectedService(event.target.value);
  };

  // Filtramos las citas según los filtros seleccionados
  useEffect(() => {
    const filtered = dates.filter((d) => {
      return (
        (selectedTherapist === '' || d.therapist === selectedTherapist) && // Filtrar por terapeuta
        (selectedPatient === '' || d.patient === selectedPatient) && // Filtrar por paciente
        (selectedService === '' || d.description === selectedService) // Filtrar por servicio
      );
    });
    setFilteredDates(filtered);
  }, [selectedTherapist, selectedPatient, selectedService, dates]);

  return (
    <div>
      <div className='flex justify-between'>
      <div className="mb-4">
        <label>Terapeuta: </label>
        <select value={selectedTherapist} onChange={handleTherapistChange}>
          <option value="">Todos</option>
          {therapists.map((therapist) => (
            <option key={therapist} value={therapist}>
              {therapist}
            </option>
          ))}
        </select>
      </div>

     
      <div className="mb-4">
        <label>Paciente: </label>
        <select value={selectedPatient} onChange={handlePatientChange}>
          <option value="">Todos</option>
          {patients.map((patient) => (
            <option key={patient} value={patient}>
              {patient}
            </option>
          ))}
        </select>
      </div>

      
      <div className="mb-4">
        <label>Servicio: </label>
        <select value={selectedService} onChange={handleServiceChange}>
          <option value="">Todos</option>
          {services.map((service) => (
            <option key={service} value={service}>
              {service}
            </option>
          ))}
        </select>
      </div>
      </div>

      {/* Renderizamos las citas filtradas */}
      {filteredDates.map((d) => {
        const formattedDate = new Date(d.date).toLocaleDateString();
        const formattedStart = new Date(d.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const formattedEnd = new Date(d.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        return (
          <div
            key={d._id}
            className="p-4 border border-slate-300 my-3 flex justify-between gap-5 items-start"
          >
            <div>
              <div>{d.title}</div>
              <div>Terapeuta: {d.therapist}</div>
              <div>Paciente: {d.patient}</div>
              <div>Fecha: {formattedDate}</div>
              <div>Hora: {formattedStart} - {formattedEnd}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default TarjetaCitas;
