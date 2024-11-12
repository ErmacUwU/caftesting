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
import BotonDeleteCitas from "../components/BotonDeleteCitas";

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

  const services = [
    { id: 1, name: "Consulta General", duration: 30, cost: 500 },
    { id: 2, name: "Terapia Física", duration: 60, cost: 1000 },
    { id: 3, name: "Consulta Especializada", duration: 45, cost: 800 },
  ];

  // Carga inicial de datos
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
          (appointmentsRes.data?.date || []).map((appointment) => ({
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

      setModalIsOpen(true);
    }
  };

  // Cerrar el modal
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
        <div className="w-1/3 p-4 bg-gray-100 relative">
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

      <div className="w-2/3 p-4">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={appointments}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          locale="es"
          buttonText={{
            today: "Hoy",
          }}
        />
      </div>

      {selectedAppointment && (
        <Modal
          isOpen={modalIsOpen}
          onRequestClose={closeModal}
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
              Hora: {selectedAppointment.formattedStart} -{" "}
              {selectedAppointment.formattedEnd}
            </p>
            <p className="text-black">Costo: ${selectedAppointment.cost}</p>
            <button
              onClick={closeModal}
              className="mt-4 bg-red-500 text-white p-2 rounded absolute top-2 right-2"
            >
              Cerrar
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Citas;
