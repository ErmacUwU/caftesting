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
  const [recurrence, setRecurrence] = useState("once"); // Nuevo estado para la recurrencia

  // Efecto para cargar datos al montar el componente
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obtener datos de pacientes, terapeutas y citas
        const [patientsRes, therapistsRes, appointmentsRes] = await Promise.all(
          [
            axios.get("/api/patient"),
            axios.get("/api/therapist"),
            axios.get("/api/date"),
          ]
        );

        console.log("Patients:", patientsRes.data);

        // Establecer estados con datos obtenidos
        setPatients(patientsRes.data.patient || []);
        setTherapists(therapistsRes.data.therapist || []);
        setAppointments(
          appointmentsRes.data.therapist.map((appointment) => ({
            id: appointment.idDate,
            title: appointment.title,
            start: new Date(appointment.start),
            end: new Date(appointment.end),
            description: appointment.description,
            therapist: appointment.therapist,
            patient: appointment.patient,
            cost: appointment.cost,
          })) || []
        );
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  // Función para manejar clic en un evento del calendario
  const handleEventClick = (info) => {
    const appointment = appointments.find((app) => app.id === info.event.id);
    if (appointment) {
      // Buscar los nombres del paciente y terapeuta
      const patient = patients.find((p) => p._id === appointment.patient);
      const therapist = therapists.find((t) => t._id === appointment.therapist);

      alert(`
        Título: ${appointment.title}
        Descripción: ${appointment.description}
        Fecha: ${appointment.start.toLocaleDateString()}
        Hora de Inicio: ${appointment.start.toLocaleTimeString()}
        Hora de Fin: ${appointment.end.toLocaleTimeString()}
        Paciente: ${
          patient ? `${patient.firstName} ${patient.lastName}` : "Desconocido"
        }
        Terapeuta: ${
          therapist
            ? `${therapist.firstName} ${therapist.lastName}`
            : "Desconocido"
        }
        Costo: $${appointment.cost}
      `);
    }
  };

  // Función para manejar el envío del formulario para crear citas
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Función para generar citas recurrentes
    const generateAppointments = (startDate, endDate, recurrenceType) => {
      const appointmentsList = [];
      let currentDate = new Date(startDate);
      const end = new Date(endDate);

      while (currentDate <= end) {
        appointmentsList.push({
          idDate: uniquid(),
          date: currentDate.toISOString().split("T")[0],
          start: new Date(
            `${currentDate.toISOString().split("T")[0]}T${appointmentStartTime}`
          ),
          end: new Date(
            `${currentDate.toISOString().split("T")[0]}T${appointmentEndTime}`
          ),
          therapist: selectedTherapist,
          patient: selectedPatient,
          title: appointmentTitle,
          description: appointmentDescription,
          cost: cost,
        });

        if (recurrenceType === "daily") {
          currentDate.setDate(currentDate.getDate() + 1);
        } else if (recurrenceType === "weekly") {
          currentDate.setDate(currentDate.getDate() + 7);
        } else if (recurrenceType === "monthly") {
          currentDate.setMonth(currentDate.getMonth() + 1);
        }
      }

      return appointmentsList;
    };

    try {
      // Calcular el rango de fechas para la recurrencia
      const startDate = new Date(appointmentDate);
      const endDate = new Date(appointmentDate);
      endDate.setDate(startDate.getDate() + 1); // Por defecto es un día después

      const appointmentsList = generateAppointments(
        startDate,
        endDate,
        recurrence
      );

      for (const appointmentData of appointmentsList) {
        // Enviar datos al backend para crear la cita
        const response = await axios.post("/api/date", appointmentData);
        console.log("Appointment created:", response.data);

        // Actualizar estado de citas con la nueva cita creada
        setAppointments((prevAppointments) => [
          ...prevAppointments,
          {
            id: response.data.idDate,
            title: response.data.title,
            start: new Date(response.data.start),
            end: new Date(response.data.end),
            description: response.data.description,
            therapist: response.data.therapist,
            patient: response.data.patient,
            cost: response.data.cost,
          },
        ]);

        // Actualizar el estado de cuenta del paciente
        await axios.patch(`/api/patient/${selectedPatient}`, {
          pacienteId: selectedPatient,
          cantidad: cost, // Asegúrate de que esto sea negativo si es un cargo
        });
      }

      // Limpiar el formulario después de enviar
      setSelectedPatient("");
      setSelectedTherapist("");
      setAppointmentDate("");
      setAppointmentStartTime("");
      setAppointmentEndTime("");
      setAppointmentTitle("");
      setAppointmentDescription("");
      setCost("");
      setRecurrence("once"); // Resetear la recurrencia
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
          Agrega un costo:
          <input
            type="number"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            className="block w-full p-2 border border-gray-300 rounded mt-1 bg-gray-400"
          />
        </label>
        <label className="block mb-2">
          Repetir Cita:
          <select
            value={recurrence}
            onChange={(e) => setRecurrence(e.target.value)}
            className="block w-full p-2 border border-gray-300 rounded mt-1 bg-gray-400"
          >
            <option value="once">Una vez</option>
            <option value="daily">Diariamente</option>
            <option value="weekly">Semanalmente</option>
            <option value="monthly">Mensualmente</option>
          </select>
        </label>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Crear Cita
        </button>
      </form>

      {/* Calendario FullCalendar para mostrar citas */}
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={appointments}
        eventClick={handleEventClick} // Maneja el clic en un evento
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
