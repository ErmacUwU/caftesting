"use client";
// Importaciones de librerías y componentes necesarios
import React, { useEffect, useState } from "react";
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

// Estilos para el modal
const customStyles = {
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.75)", // Fondo oscuro cuando el modal está abierto
    zIndex: 1000, // Asegurar que se superponga a otros elementos
  },
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
    borderRadius: "10px", // Estilo más suave en las esquinas
    padding: "20px", // Agregar espacio interno
    maxWidth: "500px", // Limitar el ancho máximo
    width: "90%", // Responsivo
  },
};

const Citas = () => {
  const [patients, setPatients] = useState([]);
  const [therapists, setTherapists] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [selectedTherapist, setSelectedTherapist] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentStartTime, setAppointmentStartTime] = useState("");
  const [appointmentEndTime, setAppointmentEndTime] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [cost, setCost] = useState("");
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [detailsModalIsOpen, setDetailsModalIsOpen] = useState(false);

  const services = [
    { id: 1, name: "Consulta General", duration: 30, cost: 500 },
    { id: 2, name: "Terapia Física", duration: 60, cost: 1000 },
    { id: 3, name: "Consulta Especializada", duration: 45, cost: 800 },
  ];

  const getEventColor = (service) => {
    switch (service) {
      case "Consulta General":
        return { backgroundColor: "#3498db", borderColor: "#000" }; // Azul
      case "Terapia Física":
        return { backgroundColor: "#2ecc71", borderColor: "#000" }; // Verde
      case "Consulta Especializada":
        return { backgroundColor: "#e74c3c", borderColor: "#000" }; // Rojo
      default:
        return { backgroundColor: "#bdc3c7", borderColor: "#000" }; // Gris
    }
  };

    // Asigna colores dinámicos a los eventos
    useEffect(() => {
      const fetchData = async () => {
        try {
          const [patientsRes, therapistsRes, appointmentsRes] = await Promise.all([
            axios.get("/api/patient"),
            axios.get("/api/therapist"),
            axios.get("/api/date"),
          ]);

          setPatients(patientsRes.data.patient || []);
          setTherapists(therapistsRes.data.therapist || []);
          setAppointments(
            (appointmentsRes.data?.date || []).map((appointment) => {
              const colors = getEventColor(appointment.title);
              return {
                idd: appointment._id,
                id: appointment.idDate,
                title: appointment.title,
                start: new Date(appointment.start),
                end: new Date(appointment.end),
                description: appointment.description,
                therapist: appointment.therapist,
                patient: appointment.patient,
                cost: appointment.cost,
                ...colors, // Agrega colores dinámicos
              };
            })
          );
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      };

      fetchData();
    }, []);

  // Función para calcular la hora de finalización
  const calculateEndTime = (startTime, duration) => {
    const [hours, minutes] = startTime.split(":").map(Number);
    const endTime = new Date();
    endTime.setHours(hours);
    endTime.setMinutes(minutes + duration);
    return endTime.toTimeString().slice(0, 5);
  };

  // Manejo de cambio de servicio
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

  // Envío del formulario para crear una cita
  const handleSubmit = async (e) => {
    e.preventDefault();

    const therapist = therapists.find((t) => t._id === selectedTherapist);
    const therapistName = therapist
      ? `${therapist.firstName} ${therapist.lastName}`
      : "";

    const patient = patients.find((p) => p._id === selectedPatient);
    const patientName = patient
      ? `${patient.firstName} ${patient.lastName}`
      : "";

    const service = services.find((s) => s.id.toString() === selectedService);

    const appointmentData = {
      idDate: uniquid(),
      date: appointmentDate,
      start: `${appointmentDate}T${appointmentStartTime}:00`,
      end: `${appointmentDate}T${appointmentEndTime}:00`,
      therapist: therapistName,
      patient: patientName,
      title: service?.name || "",
      description: service?.name || "",
      cost: parseFloat(cost),
    };

    try {
      const response = await axios.post("/api/date", appointmentData);

      // Actualización del estado de citas
      setAppointments((prevAppointments) => [
        ...prevAppointments,
        {
          idd: response.data._id,
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

      // Restablecer campos del formulario
      setSelectedPatient("");
      setSelectedTherapist("");
      setAppointmentDate("");
      setAppointmentStartTime("");
      setAppointmentEndTime("");
      setSelectedService("");
      setCost("");
      setIsFormVisible(false);
    } catch (error) {
      console.error("Error creando cita o actualizando cuenta:", error);
    }
  };

  // Función para manejar el clic en un evento del calendario
  const handleEventClick = (info) => {
    const appointment = appointments.find((app) => app.id === info.event.id);
    if (appointment) {
      const formattedDate = appointment.start.toLocaleDateString("es-ES");
      const formattedStart = appointment.start.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      const formattedEnd = appointment.end.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      setSelectedAppointment({
        ...appointment,
        formattedDate,
        formattedStart,
        formattedEnd,
      });

      setDetailsModalIsOpen(true); // Abre el modal de detalles
      
    }
  };

  // Cerrar el modal de detalles
  const closeDetailsModal = () => {
    setDetailsModalIsOpen(false);
    setSelectedAppointment(null);
  };

  // Cerrar el modal de edición
  const closeModal = () => {
    setModalIsOpen(false);
    setSelectedAppointment(null);
  };

  // Manejo de clic en la fecha para crear una nueva cita
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
          <form onSubmit={handleSubmit} className="mb-4 text-black">
            <label className="block mb-2">
              Paciente:
              <select
                value={selectedPatient}
                onChange={(e) => setSelectedPatient(e.target.value)}
                className="block w-full p-2 border border-gray-300 rounded mt-1"
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
                className="block w-full p-2 border border-gray-300 rounded mt-1"
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
                className="block w-full p-2 border border-gray-300 rounded mt-1"
              />
            </label>
            <label className="block mb-2">
              Hora de Inicio de la Cita:
              <input
                type="time"
                value={appointmentStartTime}
                onChange={(e) => {
                  setAppointmentStartTime(e.target.value);
                  if (selectedService) {
                    const service = services.find(
                      (s) => s.id === parseInt(selectedService)
                    );
                    setAppointmentEndTime(
                      calculateEndTime(e.target.value, service?.duration || 0)
                    );
                  }
                }}
                className="block w-full p-2 border border-gray-300 rounded mt-1"
              />
            </label>
            <label className="block mb-2">
              Servicio:
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
            </label>
            <label className="block mb-2">
              Hora de Cierre de la Cita:
              <input
                type="time"
                value={appointmentEndTime}
                onChange={(e) => setAppointmentEndTime(e.target.value)}
                className="block w-full p-2 border border-gray-300 rounded mt-1"
              />
            </label>
            <label className="block mb-2">
              Costo de la Cita:
              <input
                type="number"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="block w-full p-2 border border-gray-300 rounded mt-1"
              />
            </label>
            <button
              type="submit"
              className="block w-full bg-blue-500 text-white font-bold py-2 px-4 rounded mt-4"
            >
              Crear Cita
            </button>
          </form>
        </div>
      )}

      <div className="calendar-container w-2/5 p-4">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          events={appointments}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          selectable={true}
          slotLabelFormat={{
            hour: "numeric",
            minute: "2-digit",
            meridiem: "short",
            hour12: true, // Formato 12 horas
          }}
          eventTimeFormat={{
            hour: "numeric",
            minute: "2-digit",
            meridiem: "short",
            hour12: true, // Formato 12 horas
          }}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "timeGridWeek,timeGridDay",
          }}
          locale="es"
          height="auto"
          buttonText={{
            today: "Hoy",
            week: "Semana", // Personaliza "Week"
            day: "Día",     // Personaliza "Day"
          }}
          
        />
      </div>

      {selectedAppointment && (
        <Modal
          isOpen={detailsModalIsOpen}
          onRequestClose={closeDetailsModal}
          style={customStyles}
          contentLabel="Detalles de la Cita"
          ariaHideApp={false}
        >
          <div className="relative">
            <h2 className="text-black font-bold text-xl mb-4">
              {selectedAppointment.description}
            </h2>
            <p className="text-black">Paciente: {selectedAppointment.patient}</p>
            <p className="text-black">Terapeuta: {selectedAppointment.therapist}</p>
            <p className="text-black">Fecha: {selectedAppointment.formattedDate}</p>
            <p className="text-black">
              Hora: {selectedAppointment.formattedStart} - {selectedAppointment.formattedEnd}
            </p>
            <p className="text-black">Costo: ${selectedAppointment.cost}</p>
            <button
              onClick={() => {
                setModalIsOpen(true); // Abre el modal de edición
                closeDetailsModal(); // Cierra el modal de detalles
                
              }}
              className="mt-4 bg-blue-500 text-white p-2 rounded"
            >
              Editar Cita
            </button>
            <button
              onClick={closeDetailsModal}
              className="mt-4 bg-red-500 text-white p-2 rounded absolute top-2 right-2"
            >
              Cerrar
            </button>
            <div>
                <BotonDeleteCitas id={selectedAppointment.idd} />
              </div>
          </div>
        </Modal>
      )}

      {selectedAppointment && (
        <Modal
          isOpen={modalIsOpen}
          onRequestClose={closeModal}
          style={customStyles}
          ariaHideApp={false}
        >
          <ActualizarCita
            id={selectedAppointment.idd}
            selectedPatient={selectedAppointment.patient}
            selectedTherapist={selectedAppointment.therapist}
            selectedService={selectedAppointment.title}
            appointmentDate={selectedAppointment.start.toISOString().split("T")[0]}
            appointmentStartTime={selectedAppointment.start.toTimeString().slice(0, 5)}
            appointmentEndTime={selectedAppointment.end.toTimeString().slice(0, 5)}
            cost={selectedAppointment.cost}
            onClose={closeModal}
          />
        </Modal>
      )}
    </div>
  );
};

export default Citas;
