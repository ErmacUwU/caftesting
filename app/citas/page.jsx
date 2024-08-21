"use client";
// Importaciones de librerías y componentes necesarios
import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import axios from "axios";
import uniquid from "uniquid";

const Citas = () => {
  // Estados para manejar pacientes, terapeutas, citas y datos del formulario
  const [patients, setPatients] = useState([]);
  const [therapists, setTherapists] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [selectedTherapist, setSelectedTherapist] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentStartTime, setAppointmentStartTime] = useState("");
  const [appointmentEndTime, setAppointmentEndTime] = useState("");
  const [appointmentTitle, setAppointmentTitle] = useState("");
  const [appointmentDescription, setAppointmentDescription] = useState("");
  const [cost, setCost] = useState("");

  // Efecto para cargar datos al montar el componente
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [patientsRes, therapistsRes, appointmentsRes] = await Promise.all(
          [
            axios.get("/api/patient"),
            axios.get("/api/therapist"),
            axios.get("/api/date"),
          ]
        );

        setPatients(patientsRes.data.patient || []);
        setTherapists(therapistsRes.data.therapist || []);
        setAppointments(
          appointmentsRes.data.therapist.map((appointment) => ({
            id: appointment.idDate,
            title: appointment.title,
            start: new Date(appointment.start),
            end: new Date(appointment.end),
          })) || []
        );
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  // Función para manejar envío del formulario para crear una cita
  const handleSubmit = async (e) => {
    e.preventDefault();

    const appointmentData = {
      idDate: uniquid(),
      date: appointmentDate,
      start: new Date(`${appointmentDate}T${appointmentStartTime}`),
      end: new Date(`${appointmentDate}T${appointmentEndTime}`),
      therapist: selectedTherapist,
      patient: selectedPatient,
      title: appointmentTitle,
      description: appointmentDescription,
      cost: parseFloat(cost),
    };

    try {
      const response = await axios.post("/api/date", appointmentData);
      console.log("Appointment created:", response.data);

      setAppointments([
        ...appointments,
        {
          id: response.data.idDate,
          title: response.data.title,
          start: new Date(response.data.start),
          end: new Date(response.data.end),
        },
      ]);

      // Actualizar el estado de cuenta del paciente
      await axios.patch(`/api/patient/${selectedPatient}`, {
        pacienteId: selectedPatient,
        cantidad: parseFloat(cost), // Restar el costo al total
      });

      // Limpiar el formulario después de enviar
      setSelectedPatient("");
      setSelectedTherapist("");
      setAppointmentDate("");
      setAppointmentStartTime("");
      setAppointmentEndTime("");
      setAppointmentTitle("");
      setAppointmentDescription("");
      setCost("");
    } catch (error) {
      console.error("Error creating appointment or updating account:", error);
    }
  };

  // Renderizado del componente
  return (
    <div>
      <form onSubmit={handleSubmit} className="mb-4">
        <label className="block mb-2">
          Paciente:
          <select
            value={selectedPatient}
            onChange={(e) => setSelectedPatient(e.target.value)}
            className="block w-full p-2 border border-gray-300 rounded mt-1 bg-gray-400"
          >
            <option value="">Seleccione un paciente</option>
            {patients.map((patient) => (
              <option key={patient._id} value={patient._id}>
                {patient.firstName} {patient.lastName}
              </option>
            ))}
          </select>
        </label>
        <label className="block mb-2">
          Terapeuta:
          <select
            value={selectedTherapist}
            onChange={(e) => setSelectedTherapist(e.target.value)}
            className="block w-full p-2 border border-gray-300 rounded mt-1 bg-gray-400"
          >
            <option value="">Seleccione un terapeuta</option>
            {therapists.map((therapist) => (
              <option key={therapist._id} value={therapist._id}>
                {therapist.firstName} {therapist.lastName}
              </option>
            ))}
          </select>
        </label>
        <label className="block mb-2">
          Fecha de la Cita:
          <input
            type="date"
            value={appointmentDate}
            onChange={(e) => setAppointmentDate(e.target.value)}
            className="block w-full p-2 border border-gray-300 rounded mt-1 bg-gray-400"
          />
        </label>
        <label className="block mb-2">
          Hora de Inicio de la Cita:
          <input
            type="time"
            value={appointmentStartTime}
            onChange={(e) => setAppointmentStartTime(e.target.value)}
            className="block w-full p-2 border border-gray-300 rounded mt-1 bg-gray-400"
          />
        </label>
        <label className="block mb-2">
          Hora de Cierre de la Cita:
          <input
            type="time"
            value={appointmentEndTime}
            onChange={(e) => setAppointmentEndTime(e.target.value)}
            className="block w-full p-2 border border-gray-300 rounded mt-1 bg-gray-400"
          />
        </label>
        <label className="block mb-2">
          Título de la Cita:
          <input
            type="text"
            value={appointmentTitle}
            onChange={(e) => setAppointmentTitle(e.target.value)}
            className="block w-full p-2 border border-gray-300 rounded mt-1 bg-gray-400"
          />
        </label>
        <label className="block mb-2">
          Descripción de la Cita:
          <textarea
            value={appointmentDescription}
            onChange={(e) => setAppointmentDescription(e.target.value)}
            className="block w-full p-2 border border-gray-300 rounded mt-1 bg-gray-400"
          />
        </label>
        <label className="block mb-2">
          Costo de la Cita:
          <input
            type="number"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            className="block w-full p-2 border border-gray-300 rounded mt-1 bg-gray-400"
          />
        </label>
        <button
          type="submit"
          className="block w-full bg-blue-500 text-white font-bold py-2 px-4 rounded mt-4"
        >
          Crear Cita
        </button>
      </form>

      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={appointments}
        dateClick={(info) => console.log(info.dateStr)}
      />
    </div>
  );
};

export default Citas;
