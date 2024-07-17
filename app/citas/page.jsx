"use client";

import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import "@fullcalendar/core/locales-all";
import axios from "axios";
import uniquid from "uniquid";

const Citas = () => {
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
        console.log("Fetched appointments:", appointmentsRes.data.data);
        setAppointments(appointmentsRes.data.data || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const handleDateClick = (arg) => {
    alert(arg.dateStr);
  };

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
    };

    try {
      const response = await axios.post("/api/date", appointmentData);
      console.log("Appointment created:", response.data);

      // Actualizar el estado de las citas con la nueva cita creada
      setAppointments([...appointments, response.data.data]);
    } catch (error) {
      console.error("Error creating appointment:", error);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="mb-4">
        <label className="block mb-2">
          Paciente:
          <select
            value={selectedPatient}
            onChange={(e) => setSelectedPatient(e.target.value)}
            className="block w-full p-2 border border-gray-300 rounded mt-1 bg-black"
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
            className="block w-full p-2 border border-gray-300 rounded mt-1 bg-black"
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
            className="block w-full p-2 border border-gray-300 rounded mt-1 bg-black"
          />
        </label>
        <label className="block mb-2">
          Hora de Inicio de la Cita:
          <input
            type="time"
            value={appointmentStartTime}
            onChange={(e) => setAppointmentStartTime(e.target.value)}
            className="block w-full p-2 border border-gray-300 rounded mt-1 bg-black"
          />
        </label>
        <label className="block mb-2">
          Hora de Cierre de la Cita:
          <input
            type="time"
            value={appointmentEndTime}
            onChange={(e) => setAppointmentEndTime(e.target.value)}
            className="block w-full p-2 border border-gray-300 rounded mt-1 bg-black"
          />
        </label>
        <label className="block mb-2">
          Título de la Cita:
          <input
            type="text"
            value={appointmentTitle}
            onChange={(e) => setAppointmentTitle(e.target.value)}
            className="block w-full p-2 border border-gray-300 rounded mt-1 bg-black"
          />
        </label>
        <label className="block mb-2">
          Descripción de la Cita:
          <textarea
            value={appointmentDescription}
            onChange={(e) => setAppointmentDescription(e.target.value)}
            className="block w-full p-2 border border-gray-300 rounded mt-1 bg-black"
          />
        </label>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Crear Cita
        </button>
      </form>

      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={appointments
          .map((appointment) => {
            // Verificar si appointment está definido y tiene las propiedades necesarias
            if (
              !appointment ||
              !appointment._id ||
              !appointment.title ||
              !appointment.start ||
              !appointment.end
            ) {
              console.error("Invalid appointment data:", appointment);
              return null;
            }

            console.log("Mapping appointment:", appointment);
            return {
              id: appointment._id,
              title: appointment.title,
              start: new Date(appointment.start), // Asegurarse de que las fechas sean objetos de Date
              end: new Date(appointment.end),
            };
          })
          .filter((event) => event !== null)} // Filtrar eventos nulos
        dateClick={handleDateClick}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        views={{
          dayGridMonth: { buttonText: "Mes" },
          timeGridWeek: { buttonText: "Semana" },
          timeGridDay: { buttonText: "Día" },
        }}
        locale={"es"}
        buttonText={{
          today: "Hoy",
        }}
      />
    </div>
  );
};

export default Citas;
