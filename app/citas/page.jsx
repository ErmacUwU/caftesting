"use client"
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

  // Efecto para cargar datos al montar el componente
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obtener datos de pacientes, terapeutas y citas
        const [patientsRes, therapistsRes, appointmentsRes] = await Promise.all([
          axios.get("/api/patient"),
          axios.get("/api/therapist"),
          axios.get("/api/date"),
        ]);

        // Establecer estados con datos obtenidos
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

  // Función para manejar clic en una fecha del calendario
  const handleDateClick = (arg) => {
    alert(arg.dateStr);
  };

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
    };

    try {
      // Enviar datos al backend para crear la cita
      const response = await axios.post("/api/date", appointmentData);
      console.log("Appointment created:", response.data);

      // Actualizar estado de citas con la nueva cita creada
      setAppointments([
        ...appointments,
        {
          id: response.data.idDate,
          title: response.data.title,
          start: new Date(response.data.start),
          end: new Date(response.data.end),
        },
      ]);

      // Limpiar el formulario después de enviar
      setSelectedPatient("");
      setSelectedTherapist("");
      setAppointmentDate("");
      setAppointmentStartTime("");
      setAppointmentEndTime("");
      setAppointmentTitle("");
      setAppointmentDescription("");
    } catch (error) {
      console.error("Error creating appointment:", error);
    }
  };

  // Renderizado del componente
  return (
    <div>
      <form onSubmit={handleSubmit} className="mb-4">
        {/* Formulario para crear una cita */}
        {/* (Código del formulario que ya tienes) */}
      </form>

      {/* Calendario FullCalendar para mostrar citas */}
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={appointments}
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
        locale="es"
        buttonText={{
          today: "Hoy",
        }}
      />
    </div>
  );
};

export default Citas;
