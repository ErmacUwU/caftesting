"use client";

// Importaciones necesarias
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.js";
import { useRouter } from "next/navigation";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import axios from "axios";
import uniquid from "uniquid";
import Modal from "react-modal";
import ActualizarCita from "../components/ActualizarCitas";
import BotonDeleteCitas from "../components/BotonDeleteCitas";
import "./app.css";
import "rsuite/dist/rsuite-no-reset.min.css"; // Estilos sin reset global


// ✅ Importamos `TimePicker` de rsuite
import { TimePicker } from "rsuite";

const Citas = () => {
  const [patients, setPatients] = useState([]);
  const [therapists, setTherapists] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [selectedTherapist, setSelectedTherapist] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentStartTime, setAppointmentStartTime] = useState(null);
  const [appointmentEndTime, setAppointmentEndTime] = useState(null);
  const [selectedService, setSelectedService] = useState("");
  const [cost, setCost] = useState("");
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [modalType, setModalType] = useState(null); // "details" o "edit"
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const services = [
    { id: 1, name: "Consulta General", duration: 30 },
    { id: 2, name: "Terapia Física", duration: 60 },
    { id: 3, name: "Consulta Especializada", duration: 45 },
  ];

  const [workSchedule, setWorkSchedule] = useState({
    startTime: "08:00",
    endTime: "18:00",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [patientsRes, therapistsRes, appointmentsRes, scheduleRes] =
          await Promise.all([
            axios.get("/api/patient"),
            axios.get("/api/therapist"),
            axios.get("/api/date"),
            axios.get("/api/schedule"),
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
            description: appointment.description,
            therapist: appointment.therapist,
            patient: appointment.patient,
            cost: appointment.cost,
          }))
        );

        if (scheduleRes.data) {
          setWorkSchedule({
            startTime: scheduleRes.data.startTime,
            endTime: scheduleRes.data.endTime,
          });
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  const calculateEndTime = (startTime, duration) => {
    if (!startTime || !duration) return "";
    const [hours, minutes] = startTime.split(":").map(Number);
    const endMinutes = minutes + duration;
    const endHours = hours + Math.floor(endMinutes / 60);
    return `${String(endHours).padStart(2, "0")}:${String(
      endMinutes % 60
    ).padStart(2, "0")}`;
  };

  const handleServiceChange = (e) => {
    const selectedServiceId = e.target.value;
    setSelectedService(selectedServiceId);

    if (appointmentStartTime && selectedServiceId) {
      const selectedService = services.find(
        (service) => service.id.toString() === selectedServiceId
      );
      setAppointmentEndTime(
        calculateEndTime(appointmentStartTime, selectedService.duration)
      );
    }
  };

  const handleDateClick = (info) => {
    setAppointmentDate(info.dateStr);
    setIsFormVisible(true);
  };

  return (
    <div className="flex justify-center">
      {isFormVisible && (
        <div className="w-3/5 p-4 bg-gray-100 relative">
          <button
            onClick={() => setIsFormVisible(false)}
            className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded"
          >
            X
          </button>
          <form className="mb-4 text-black">
            <label className="block mb-2">Hora de Inicio de la Cita:</label>
            <TimePicker
              format="HH:mm"
              
              value={appointmentStartTime ? new Date(`2023-01-01T${appointmentStartTime}`) : null}
              onChange={(newValue) => {
                if (newValue) {
                  const formattedTime = newValue.toTimeString().slice(0, 5);
                  setAppointmentStartTime(formattedTime);
                  if (selectedService) {
                    const service = services.find((s) => s.id.toString() === selectedService);
                    setAppointmentEndTime(calculateEndTime(formattedTime, service?.duration || 0));
                  }
                }
              }}
              hideMinutes={(minute) => minute % 5 !== 0} 
              cleanable={false}
              placement="bottomStart"
              className="block w-full p-2 border border-gray-300 rounded mt-1"
            />

            <label className="block mt-4">Servicio:</label>
            <select
              value={selectedService}
              onChange={handleServiceChange}
              className="block w-full p-2 border border-gray-300 rounded mt-1"
            >
              <option value="">Seleccione un servicio</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>

            <label className="block mt-4">Hora de Cierre de la Cita:</label>
            <TimePicker
              format="HH:mm"
              value={appointmentEndTime ? new Date(`2023-01-01T${appointmentEndTime}`) : null}
              onChange={(newValue) => {
                if (newValue) {
                  const formattedTime = newValue.toTimeString().slice(0, 5);
                  setAppointmentEndTime(formattedTime);
                }
              }}
              hideMinutes={(minute) => minute % 5 !== 0} 
              cleanable={false}
              
              className="block w-full p-2 border border-gray-300 rounded mt-1"
            />
          </form>
        </div>
      )}

      <div className="calendar-container w-2/5 p-4">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          events={appointments}
          dateClick={handleDateClick}
          selectable={true}
          slotLabelFormat={{
            hour: "numeric",
            minute: "2-digit",
            hour12: false,
          }}
          slotMinTime={workSchedule.startTime}
          slotMaxTime={workSchedule.endTime}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "timeGridWeek,timeGridDay",
          }}
          locale="es"
          height="auto"
          slotMinHeight={50}
          buttonText={{
            today: "Hoy",
            week: "Semana",
            day: "Día",
          }}
        />
      </div>
    </div>
  );
};

export default Citas;
