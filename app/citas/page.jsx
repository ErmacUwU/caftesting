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

// Estilos para el modal (bloquear interacción fuera y centrado)
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
            date: appointment.date, // Usamos el campo date directamente
            therapist: appointment.therapist, // Nombre del terapeuta
            patient: appointment.patient, // Nombre del paciente
            description: appointment.description, // Descripción o título de la cita
            cost: appointment.cost, // Costo de la cita
          })) || []
        );
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

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
      start: `${appointmentDate}T${appointmentStartTime}:00`, // Formato ISO para la fecha y hora de inicio
      end: `${appointmentDate}T${appointmentEndTime}:00`, // Formato ISO para la fecha y hora de fin
      therapist: therapistName,
      patient: patientName,
      title: service?.name || "",
      description: service?.name || "",
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
          date: response.data.date,
          therapist: response.data.therapist,
          patient: response.data.patient,
          description: response.data.description,
          cost: response.data.cost,
        },
      ]);

      await axios.patch(`/api/patient/${selectedPatient}`, {
        pacienteId: selectedPatient,
        cantidad: parseFloat(cost),
      });

      setSelectedPatient("");
      setSelectedTherapist("");
      setAppointmentDate("");
      setAppointmentStartTime("");
      setAppointmentEndTime("");
      setSelectedService("");
      setCost("");
      setIsFormVisible(false);
    } catch (error) {
      console.error("Error creating appointment or updating account:", error);
    }
  };

  // Función para abrir el modal con la información de la cita seleccionada
  const openModal = (appointment) => {
    // Asegúrate de que la fecha está en el formato adecuado
    const formattedDate = new Date(appointment.date).toLocaleDateString(); // Convertir a una fecha legible

    setSelectedAppointment({
      ...appointment,
      formattedDate,
    });
    setModalIsOpen(true);
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

  // Cerrar el formulario de citas
  const handleCloseForm = () => {
    setIsFormVisible(false);
    setSelectedPatient("");
    setSelectedTherapist("");
    setAppointmentDate("");
    setAppointmentStartTime("");
    setAppointmentEndTime("");
    setSelectedService("");
    setCost("");
  };

  return (
    <div className="flex justify-center">
      {isFormVisible && (
        <div className="w-1/3 p-4 bg-gray-100 relative">
          <button
            onClick={handleCloseForm}
            className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded cursor-pointer"
          >
            X
          </button>
          <form onSubmit={handleSubmit} className="mb-4 text-black">
            <label className="block mb-2">
              Paciente:
              <select
                value={selectedPatient}
                onChange={(e) => setSelectedPatient(e.target.value)}
                className="block w-full p-2 border border-gray-300 rounded mt-1 cursor-pointer"
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
                className="block w-full p-2 border border-gray-300 rounded mt-1 cursor-pointer"
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
                className="block w-full p-2 border border-gray-300 rounded mt-1 cursor-pointer"
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
                      (s) => s.name === selectedService
                    );
                    setAppointmentEndTime(
                      calculateEndTime(e.target.value, service?.duration || 0)
                    );
                  }
                }}
                className="block w-full p-2 border border-gray-300 rounded mt-1 cursor-pointer"
              />
            </label>
            <label className="block mb-2">
              Servicio:
              <select
                value={selectedService}
                onChange={handleServiceChange}
                className="block w-full p-2 border border-gray-300 rounded mt-1 cursor-pointer"
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
                step="300" // Incrementos de 5 minutos
                className="block w-full p-2 border border-gray-300 rounded mt-1 cursor-pointer"
              />
            </label>
            <label className="block mb-2">
              Costo de la Cita:
              <input
                type="number"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="block w-full p-2 border border-gray-300 rounded mt-1 cursor-pointer"
                step="1" // Incrementos de 1 peso
              />
            </label>
            <button
              type="submit"
              className="block w-full bg-blue-500 text-white font-bold py-2 px-4 rounded mt-4 cursor-pointer"
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
          eventClick={(info) => openModal(info.event.extendedProps)}
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
            <p className="text-black">Costo: ${selectedAppointment.cost}</p>

            <button
              onClick={closeModal}
              className="mt-4 bg-red-500 text-white p-2 rounded absolute top-2 right-2 cursor-pointer"
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

