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



// Estilos para el modal (puedes personalizar)
const customStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
  },
};

const Citas = () => {
  // Estados para manejar pacientes, terapeutas, citas, formulario y modales
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

  // Servicios predefinidos con sus duraciones y costos
  const services = [
    { id: 1, name: "Consulta General", duration: 30, cost: 500 },
    { id: 2, name: "Terapia Física", duration: 60, cost: 1000 },
    { id: 3, name: "Consulta Especializada", duration: 45, cost: 800 },
  ];

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
            ...appointment
          })) || []
        );
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  // Función para manejar cambio de servicio seleccionado
     const handleServiceChange = (e) => {
       const selectedServiceId = e.target.value;
       setSelectedService(selectedServiceId); // Guarda el ID del servicio
       const service = services.find(
         (s) => s.id.toString() === selectedServiceId
       );
       setCost(service?.cost || "");
       setAppointmentEndTime(
         service && appointmentStartTime
           ? calculateEndTime(appointmentStartTime, service.duration)
           : ""
       );
     };




  // Función para calcular la hora de finalización de la cita
  const calculateEndTime = (startTime, duration) => {
    const [hours, minutes] = startTime.split(":").map(Number);
    const end = new Date();
    end.setHours(hours);
    end.setMinutes(minutes + duration);
    return end.toTimeString().slice(0, 5); // Retorna en formato HH:MM
  };

  // Función para manejar envío del formulario para crear una cita
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Busca el terapeuta seleccionado basado en su ID
    const therapist = therapists.find((t) => t._id === selectedTherapist);
    const therapistName = therapist
      ? `${therapist.firstName} ${therapist.lastName}`
      : "";

    // Busca el paciente seleccionado basado en su ID
    const patient = patients.find((p) => p._id === selectedPatient);
    const patientName = patient
      ? `${patient.firstName} ${patient.lastName}`
      : "";

    // Buscar el nombre del servicio utilizando el ID almacenado
    const service = services.find((s) => s.id.toString() === selectedService);

    const appointmentData = {
      idDate: uniquid(),
      date: appointmentDate,
      start: new Date(`${appointmentDate}T${appointmentStartTime}`),
      end: new Date(`${appointmentDate}T${appointmentEndTime}`),
      therapist: therapistName,
      patient: patientName,
      title: service?.name || "", // Guarda el nombre del servicio como título
      description: service?.name || "", // También guarda el nombre como descripción si es necesario
      cost: parseFloat(cost),
    };

    // Imprime el objeto appointmentData en la consola
    console.log("Appointment Data:", appointmentData.date);
    

    try {
      const response = await axios.post("/api/date", appointmentData);
      console.log("Appointment created:", response.data);

      setAppointments([
        ...appointments,
        {
          id: response.data.idDate,
          title: response.data.title, // Esto ahora contiene el nombre del servicio
          date: response.data.date,
          start: new Date(response.data.start),
          end: new Date(response.data.end),
        },
      ]);

      // Actualizar el estado de cuenta del paciente
      await axios.patch(`/api/patient/${selectedPatient}`, {
        pacienteId: selectedPatient,
        cantidad: parseFloat(cost),
      });

      // Limpiar el formulario después de enviar
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
    
    console.log("Appointment data in openModal:", appointment);
    setSelectedAppointment(appointment);
    setModalIsOpen(true);
  };

  // Función para cerrar el modal
  const closeModal = () => {
    setModalIsOpen(false);
    setSelectedAppointment(null);
  };

  // Función para mostrar el formulario de creación de citas
  const handleDateClick = (info) => {
    setAppointmentDate(info.dateStr);
    setIsFormVisible(true);
  };

  // Función para cerrar el formulario de creación de citas
  const handleCloseForm = () => {
    setIsFormVisible(false);
    // Limpiar el formulario
    setSelectedPatient("");
    setSelectedTherapist("");
    setAppointmentDate("");
    setAppointmentStartTime("");
    setAppointmentEndTime("");
    setSelectedService("");
    setCost("");
  };

  // Renderizado del componente
  return (
    <div className="flex">
      {isFormVisible && (
        <div className="w-1/3 p-4 bg-gray-100 relative">
          <button
            onClick={handleCloseForm}
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
                      (s) => s.name === selectedService
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
                step="300" // Incrementos de 5 minutos
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
                step="1" // Incrementos de 1 peso
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
          ariaHideApp={false} // Esto desactiva la advertencia, pero no es recomendado
        >
          <h2 className="text-black">{selectedAppointment.description}</h2>
          {console.log("Fecha :", selectedAppointment.date)}
          <p className="text-black">Paciente: {selectedAppointment.patient}</p>
          <p className="text-black">
            Terapeuta: {selectedAppointment.therapist}
          </p>

          <p>
            Fecha: {new Date(selectedAppointment.start).toLocaleDateString()}
          </p>
          <p>
            Hora:{" "}
            {`${new Date(
              selectedAppointment.start
            ).toLocaleTimeString()} - ${new Date(
              selectedAppointment.end
            ).toLocaleTimeString()}`}
          </p>

          <p className="text-black">Costo: ${selectedAppointment.cost}</p>
          <button
            onClick={closeModal}
            className="mt-4 bg-red-500 text-white p-2 rounded"
          >
            Cerrar
          </button>
        </Modal>
      )}
    </div>
  );
};

export default Citas;
