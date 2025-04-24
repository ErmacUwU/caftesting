"use client";
import React, { useState, useEffect } from "react";
import CalendarioCitas from "../components/CalendarioCitas.jsx";
import { useAuth } from "../context/AuthContext.js"; 
import { useRouter } from "next/navigation";
import axios from "axios";

const Citas = () => {
    const [patients, setPatients] = useState([]);

    const [therapists, setTherapists] = useState([]);

const [appointments, setAppointments] = useState([]);

const [workSchedule, setWorkSchedule] = useState({
    startTime: "08:00:00",
    endTime: "18:00:00",

});



const { isAuthenticated, isLoading } = useAuth();

const router = useRouter();

  // Cargar datos iniciales
useEffect(() => {
    const fetchData = async () => {
    try {
        const [patientsRes, therapistsRes, appointmentsRes] = await Promise.all([
        axios.get("/api/patient"),
        axios.get("/api/therapist"),
        axios.get("/api/date")
        ]);

        setPatients(patientsRes.data.patient || []);
        setTherapists(therapistsRes.data.therapist || []);
        setAppointments(
        (appointmentsRes.data?.date || []).map((appointment) => ({
            idd: appointment._id,
            id: appointment.idDate,
            title: appointment.title,
            start: new Date(appointment.start),
            end: new Date(appointment.end),
            duration: appointment.duration,
            therapist: appointment.therapist,
            patient: appointment.patient,
            cost: appointment.cost,
        }))
        );
    } catch (error) {
        console.error("Error fetching data:", error);
    }
    };

    if (isAuthenticated) {fetchData();}}, [isAuthenticated]);

const handleEventClick = (info) => {
    const appointment = appointments.find((app) => app.id === info.event.id);
    if (appointment) {
        setSelectedAppointment({
        ...appointment,
        formattedDate: appointment.start.toLocaleDateString("es-ES"),
        formattedStart: appointment.start.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        }),
        formattedEnd: appointment.end.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
      });
      setModalType("details");
    }
  };
  
  const handleEventDrop = async (eventDropInfo) => {
    const { event } = eventDropInfo;

    // Extraer la nueva fecha del evento
    const newDate = event.start.toISOString().split("T")[0]; // Formato YYYY-MM-DD

    console.log("Evento movido:", event.title);
    console.log("IDD enviado:", event.extendedProps.idd);
    console.log("Start antes de enviar:", event.start.toISOString());
    console.log("End antes de enviar:", event.end.toISOString());

    try {
        const response = await axios.put(`/api/date/${event.extendedProps.idd}`, {
            newDate, 
            newStart: event.start.toISOString(),
            newEnd: event.end.toISOString(),
        });

        console.log("Evento actualizado en la base de datos:", response.data);

        

    } catch (error) {
        console.error("Error al actualizar evento:", error);
    }
};

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return <p>Cargando...</p>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div>
      <CalendarioCitas
        events={appointments}
        workSchedule={workSchedule}
        patients={patients}
        therapists={therapists}
        onEventClick={handleEventClick}
        onEventDrop={handleEventDrop}
        onDateClick={handleDateClick}
        onOpenSchedule={() => {/* tu lógica para abrir modal */}}
      />
    </div>
  )
}

export default Citas;