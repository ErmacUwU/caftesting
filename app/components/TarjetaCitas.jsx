'use client'
import React, { useEffect, useState } from 'react';
import Link from "next/link";
import { PenBoxIcon } from "lucide-react";
import BotonDeleteCitas from './BotonDeleteCitas';
import { ArrowDownIcon, ArrowUpIcon } from "@heroicons/react/24/outline";
/* xlsx Nos permite crear archivos Excel y 
 file-saver permite descargar archivos en el navegador */
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import Terapeutas from '../terapeuta/page';
import ActualizarCita from './ActualizarCitas';
import Modal from "react-modal";

const TarjetaCitas = () => {

  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [dates, setDates] = useState([]);
  const [filteredDates, setFilteredDates] = useState([]);
  const [therapists, setTherapists] = useState([]);
  const [patients, setPatients] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedTherapist, setSelectedTherapist] = useState('');
  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [filtersVisible, setFiltersVisible] = useState(false);

  const toggleFilters = () => {
    setFiltersVisible(!filtersVisible);
  };

  // Función robusta para obtener nombres (maneja perfiles de UserTrue poblados)
 const getNombre = (entidad) => {
  if (!entidad) return "No asignado";
  
  // Imprimir el objeto completo para ver qué propiedades tiene
  // Esto te dirá exactamente dónde buscar
  console.log("Objeto entidad completo:", entidad);

  // Intentamos todas las rutas comunes
  const f = 
    entidad.firstName || 
    entidad.patientProfile?.firstName || 
    entidad.therapistProfile?.firstName || 
    entidad.name || 
    "";
    
  const l = 
    entidad.lastName || 
    entidad.patientProfile?.lastName || 
    entidad.therapistProfile?.lastName || 
    "";

  const nombreCompleto = `${f} ${l}`.trim();
  return nombreCompleto.length > 0 ? nombreCompleto : "Nombre no encontrado";
};

  useEffect(() => {
    const getDates = async () => {
      try {
        const res = await fetch("/api/date", {
          cache: "no-store"
        });

        if (!res.ok) {
          throw new Error("Failed to fetch date");
        }

        const data = await res.json();
        setDates(data.date || []);
        setFilteredDates(data.date || []);

        const uniqueTherapists = [
          ...new Map(
            data.date
              .filter((d) => d.therapist && d.therapist._id)
              .map((d) => [d.therapist._id, d.therapist])
          ).values(),
        ];
        const uniquePatients = [
          ...new Map(
            data.date
              .filter((d) => d.patient && d.patient._id)
              .map((d) => [d.patient._id, d.patient])
          ).values(),
        ];        
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

  // 🔹 Este efecto fuerza el select cuando los servicios cargan
useEffect(() => {
  if (services.length > 0 && selectedService) {
    setNewService(selectedService.toString());
    // Opcional: Si quieres que al abrir el modal se ajusten automáticamente los otros valores:
    const svc = services.find((s) => s._id.toString() === selectedService.toString());
    if (svc) {
      setNewDuration(svc.duration);
      setNewCost(svc.cost);
    }
  }
}, [services, selectedService]);

  const handleTherapistChange = (event) => setSelectedTherapist(event.target.value);
  const handlePatientChange = (event) => setSelectedPatient(event.target.value);
  const handleServiceChange = (event) => setSelectedService(event.target.value);
  const handleDateChange = (event) => {
    const selectedDateISO = new Date(event.target.value).toISOString().split("T")[0];
    setSelectedDate(selectedDateISO);
  };
  const handleStartDateChange = (event) => setStartDate(event.target.value);
  const handleEndDateChange = (event) => setEndDate(event.target.value);

  useEffect(() => {
    const filtered = dates.filter((d) => {
      const appointmentDate = new Date(d.date).toISOString().split("T")[0];
      const isWithinRange = (!startDate || new Date(d.date) >= new Date(startDate)) &&
                            (!endDate || new Date(d.date) <= new Date(endDate));

      return (selectedTherapist === '' || d.therapist?._id === selectedTherapist) &&
            (selectedPatient === '' || d.patient?._id === selectedPatient) &&
            (selectedService === '' || d.description === selectedService) &&
            (selectedDate === '' || appointmentDate === selectedDate) &&
            isWithinRange;
    });
    setFilteredDates(filtered);
  }, [selectedTherapist, selectedPatient, selectedService, selectedDate, startDate, endDate, dates]);

  const formatToLocalDate = (dateString) => {
    const [year, month, day] = dateString.split("T")[0].split("-");
    const localDate = new Date(year, month - 1, day);
    return localDate.toLocaleDateString("es-ES", { timeZone: "America/Tijuana" });
  };

  const formatToLocalTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: "America/Tijuana" });
  };

  const exportToExcel = () => {
    if (filteredDates.length === 0){
      alert("No hay citas para exportar.")
      return
    }

    const dataToExport = filteredDates.map((cita) => ({
      Servicio: cita.title,
      Terapeuta: getNombre(cita.therapist),
      Paciente: getNombre(cita.patient),
      Fecha: new Date(cita.date).toLocaleDateString("es-MX"),
      HoraInicio: new Date(cita.date).toLocaleTimeString("es-MX", {hour: '2-digit', minute: '2-digit'}),
      HoraFin: new Date(cita.end).toLocaleTimeString("es-MX", {hour: '2-digit', minute: '2-digit'}),
      Duración: `${cita.duration} minutos`,
      Costo: `$${cita.cost}`,
    }))

    const worksheet = XLSX.utils.json_to_sheet(dataToExport)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Agendas")
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
    const data = new Blob([excelBuffer], {type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"})
    saveAs(data, "Agendas.xlsx")
  }

  const refetchAppointments = async () => {
    try {
      const res = await fetch("/api/date", { cache: "no-store" })
      const data = await res.json()
      setDates(data.date || [])
      setFilteredDates(data.date || []) 
    } catch (error) {
      console.error("Error al recargar citas:", error)
    }
  }

  return (
    <div className="p-6 rounded-lg shadow-lg">

      <button 
        onClick={toggleFilters} 
        className="text-blue-700 mb-4 p-2 font-semibold flex items-center gap-2"
      >
        {filtersVisible ? "⤣" :"⤥" } Agregar Filtros
      </button>

      {filtersVisible && (
        <div>
          <div className="mb-4 text-black">
            <label className="block mb-1 font-semibold">Filtrar por terapeuta:</label>
            <select 
              value={selectedTherapist} 
              onChange={handleTherapistChange} 
              className="border border-gray-400 rounded-md p-2 w-full"
            >
              <option value="">Todos</option>
              {therapists.map((therapist) => (
                <option key={therapist._id} value={therapist._id}>
                  {getNombre(therapist)}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4 text-black">
            <label className="block mb-1 font-semibold">Filtrar por paciente:</label>
            <select 
              value={selectedPatient} 
              onChange={handlePatientChange} 
              className="border border-gray-400 rounded-md p-2 w-full"
            >
              <option value="">Todos</option>
              {patients.map((patient) => (
                <option key={patient._id} value={patient._id}>
                  {getNombre(patient)}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4 text-black">
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

          <div className="mb-4 text-black">
            <label className="block mb-1 font-semibold">Fecha Única:</label>
            <input 
              type="date" 
              value={selectedDate} 
              onChange={handleDateChange} 
              className="border border-gray-400 rounded-md p-2 w-full"
            />
          </div>

          <div className="mb-4 text-black">
            <label className="block mb-1 font-semibold">Rango de tiempo:</label>
            <div className="flex gap-4">
              <input 
                type="date" 
                value={startDate} 
                onChange={handleStartDateChange} 
                className="border border-gray-400 rounded-md p-2 w-full"
              />
              <input 
                type="date" 
                value={endDate} 
                onChange={handleEndDateChange} 
                className="border border-gray-400 rounded-md p-2 w-full"
              />
            </div>
          </div>
        </div>
      )}

      <button
        onClick={exportToExcel}
        className="mb-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        Exportar a Excel
      </button>

      {filteredDates.map((d) => {

        console.log("Cita ID:", d._id);
  console.log("Objeto Terapeuta recibido:", d.therapist); 
  console.log("Objeto Paciente recibido:", d.patient);
        return(
        <div key={d._id} className="p-4 border border-gray-300 rounded-md my-3 flex justify-between items-start bg-gray-50 shadow-sm">
          <div>
            <div className="font-semibold text-black text-lg">{d.title}</div>
            <div className="text-black">Terapeuta: {getNombre(d.therapist)}</div>
            <div className="text-black">Paciente: {getNombre(d.patient)}</div>
            <div className="text-black">
              Fecha: {formatToLocalDate(d.date)} | 
              Hora: {formatToLocalTime(d.start)} - {formatToLocalTime(d.end)}
            </div>
          </div>
          
          <div className="flex gap-2 py-2">
            <button onClick={() => {
              setSelectedAppointment(d);
              setIsEditModalOpen(true);
            }}>
              <PenBoxIcon size={24} color="blue" />
            </button>
            <BotonDeleteCitas id={d._id} />
          </div>
        </div>)
})}

      <Modal
        isOpen={isEditModalOpen}
        onRequestClose={() => setIsEditModalOpen(false)}
        style={{
          overlay: { backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 1000 },
          content: { margin: "auto", padding: "2rem", maxWidth: "600px", width: "95%" }
        }}
      >
        <h2 className='text-xl font-semibold mb-4'>Editar Cita</h2>

        {selectedAppointment && (
          <ActualizarCita
            id={selectedAppointment._id}
            selectedPatient={selectedAppointment.patient?._id || selectedAppointment.patient}
            selectedTherapist={selectedAppointment.therapist?._id || selectedAppointment.therapist}
            selectedService={selectedAppointment.serviceId || ""}
            appointmentDate={selectedAppointment.date ? new Date(selectedAppointment.date).toISOString().split('T')[0] : ""}
            appointmentStartTime={new Date(selectedAppointment.start).toTimeString().slice(0, 5)}
            appointmentEndTime={new Date(selectedAppointment.end).toTimeString().slice(0, 5)}
            appointmentDuration={selectedAppointment.duration}
            cost={selectedAppointment.cost}
            onClose={() => setIsEditModalOpen(false)}
            onUpdate={() => {
              setIsEditModalOpen(false);
              refetchAppointments();
            }}
          />
        )}
        <button
          onClick={() => setIsEditModalOpen(false)}
          className='mt-4 bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded'
        >
          Cerrar
        </button>
      </Modal>
    </div>
  );
}

export default TarjetaCitas;