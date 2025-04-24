"use client";
// Importaciones de librerías y componentes necesarios
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.js"; 
import { useRouter } from "next/navigation";
import { TimePicker } from "rsuite";
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


// Estilos para el modal
const customStyles = {
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    zIndex: 1000,
  },
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
    borderRadius: "10px",
    padding: "20px",
    maxWidth: "500px",
    width: "90%",
  },
};

const Citas = () => {
  const [patients, setPatients] = useState([]);
  const [therapists, setTherapists] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [selectedTherapist, setSelectedTherapist] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentStartTime, setAppointmentStartTime] = useState(null);
  const [appointmentEndTime, setAppointmentEndTime] = useState(null);
  const [appointmentDuration, setAppointmentDuration] = useState(0);
  const [selectedService, setSelectedService] = useState("");
  const [cost, setCost] = useState("");
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [modalType, setModalType] = useState(null); // "details" o "edit"
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  const services = [
    { id: 1, name: "Consulta General", duration: 30, cost: 500 },
    { id: 2, name: "Terapia Física", duration: 60, cost: 1000 },
    { id: 3, name: "Consulta Especializada", duration: 45, cost: 800 },
  ];

 const [workSchedule, setWorkSchedule] = useState({
    startTime: "08:00:00", // Inicio de jornada
    endTime: "18:00:00",   // Fin de jornada
  });

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  
  // Cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [patientsRes, therapistsRes, appointmentsRes, scheduleRes] = await Promise.all([
          axios.get("/api/patient"),
          axios.get("/api/therapist"),
          axios.get("/api/date"),
          axios.get("/api/schedule")
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
              duration: appointment.duration,
              description: appointment.description,
              therapist: appointment.therapist,
              patient: appointment.patient,
              cost: appointment.cost,
              ...colors,
            };
          })
        );

        // Asignar horario de trabajo desde la base de datos
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
      router.replace('/login'); // ⬅ Redirige solo si no está autenticado
      }
    }, [isAuthenticated, isLoading, router]);

  // Guardar cambios de horario en la base de datos
  const handleSaveSchedule = async () => {
    
      const response = await axios.put("/api/schedule", workSchedule, {
        headers: { "Content-Type": "application/json" },
      });
  
      console.log("Horario actualizado:", response.data);
      setIsScheduleModalOpen(false);
    
  };
  

  const getEventColor = (service) => {
    switch (service) {
      case "Consulta General":
        return { backgroundColor: "#3498db", borderColor: "#000" };
      case "Terapia Física":
        return { backgroundColor: "#2ecc71", borderColor: "#000" };
      case "Consulta Especializada":
        return { backgroundColor: "#e74c3c", borderColor: "#000" };
      default:
        return { backgroundColor: "#bdc3c7", borderColor: "#000" };
    }
  };

  const calculateEndTime = (startTime, duration) => {
    if (!startTime || !duration) return "";
    const [hours, minutes] = startTime.split(":").map(Number);
    const endMinutes = minutes + duration;
    const endHours = hours + Math.floor(endMinutes / 60);
    return `${String(endHours).padStart(2, "0")}:${String(
      endMinutes % 60
    ).padStart(2, "0")}`;
  };

  // Actualizar duración y hora de fin automáticamente
  const handleDurationChange = (e) => {
    let newDuration = parseInt(e.target.value, 10);
    if (newDuration > 120) newDuration = 120; // Máximo 2 horas
    if (newDuration < 0) newDuration = 0; // No puede ser negativa

    setAppointmentDuration(newDuration);
    if (appointmentStartTime) {
      setAppointmentEndTime(calculateEndTime(appointmentStartTime, newDuration));
    }
  };


  const handleServiceChange = (e) => {
    const selectedServiceId = e.target.value;
    setSelectedService(selectedServiceId);

    const service = services.find((s) => s.id.toString() === selectedServiceId);
    if (service) {
      setAppointmentDuration(service.duration); // Asignar duración predefinida
      setCost(service.cost); // Asignar costo
      if (appointmentStartTime) {
        setAppointmentEndTime(calculateEndTime(appointmentStartTime, service.duration));
      }
    }
  };

  const convertToUTC = (localTime) => {
    const localDate = new Date(`${appointmentDate}T${localTime}:00`);
    return new Date(localDate.getTime() - localDate.getTimezoneOffset() * 60000).toISOString();
  };


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
      start: convertToUTC(appointmentStartTime),
      end: convertToUTC(appointmentEndTime),
      duration: appointmentDuration,
      therapist: therapist,
      patient: patient,
      title: service?.name || "",
      description: service?.name || "",
      cost: parseFloat(cost),
    };

    try {
      const response = await axios.post("/api/date", appointmentData);
      console.log("Duración enviada:", appointmentDuration);


      setAppointments((prevAppointments) => [
        ...prevAppointments,
        {
          idd: response.data._id,
          id: response.data.idDate,
          title: response.data.title,
          start: new Date(response.data.start),
          end: new Date(response.data.end),
          duration: response.data.duration,
          description: response.data.description,
          therapist: response.data.therapist,
          patient: response.data.patient,
          cost: response.data.cost,
        },
      ]);


// 🔹 Construir el objeto `patchData` dinámicamente
const patchData = {
  pacienteId: selectedPatient,
  nuevaCita: {
    fecha: appointmentDate,
    costo: parseFloat(cost),
  },
};

      console.log("Enviando PATCH a:", `/api/patient/${selectedPatient}`);
      console.log("Datos enviados:", patchData);

      // 🔹 Actualizar el estado de cuenta del paciente
      await axios.patch(`/api/patient/${selectedPatient}`, patchData);


      setSelectedPatient("");
      setSelectedTherapist("");
      setAppointmentDate("");
      setAppointmentStartTime("");
      setAppointmentEndTime("");
      setAppointmentDuration("");
      setSelectedService("");
      setCost("");
      setIsFormVisible(false);
    } catch (error) {
      console.error("Error creando cita o actualizando cuenta:", error);
    }
  };

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

  

  const closeModal = () => {
    setSelectedAppointment(null);
    setModalType(null);
  };

  const openEditModal = () => {
    setModalType("edit");
  };

  const handleDateClick = (info) => {
  const clickedDateTime = info.date;
  const dateStr = clickedDateTime.toISOString().split('T')[0];
  const timeStr = clickedDateTime.toLocaleTimeString('en-US', { 
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit' 
  }).slice(0, 5);


    setAppointmentDate(dateStr);
    setAppointmentStartTime(timeStr);
    setIsFormVisible(true);

    //se calcula la hora seleccionada
    if (selectedService) {
      const service = services.find(s => s.id.toString() === selectedService);
      if (service) {
        setAppointmentDuration(service.duration);
        setAppointmentEndTime(calculateEndTime(timeStr, service.duration));
      }
    }
  };


  return (
    <div className="flex min-h-screen">
      {isFormVisible && (
        <div className="w-1/3 min-w-[300px] p-4 bg-gray-100 shadow-lg z-20 sticky top-0 h-screen overflow-y-auto">
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
              <TimePicker
              format="HH:mm"
              placeholder="Selecciona hora"
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
              placement="topStart"
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

            <label className="block mb-2">Duración de la Cita (minutos):</label>
            <select
              value={appointmentDuration}
              onChange={handleDurationChange}
              className="block w-full p-2 border border-gray-300 rounded mt-1"
            >
              {[...Array(25)].map((_, i) => {
                const minutes = (i + 1) * 5; // Genera valores: 5, 10, 15 ... 120
                return (
                  <option key={minutes} value={minutes}>
                    {minutes} min
                  </option>
                );
              })}
            </select>

            <label className="block mb-2">
              Hora de Cierre de la Cita:
              <TimePicker
              format="HH:mm"
              placeholder="Selecciona hora"
              value={appointmentEndTime ? new Date(`2023-01-01T${appointmentEndTime}`) : null}
              onChange={(newValue) => {
                if (newValue) {
                  const formattedTime = newValue.toTimeString().slice(0, 5);
                  setAppointmentEndTime(formattedTime);
                }
              }}
              hideMinutes={(minute) => minute % 5 !== 0} 
              cleanable={false}
              placement="topStart"
              className="block w-full p-2 border border-gray-300 rounded mt-1"
              disabled
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

      {/* Modal de ajuste de horario */}
      {isScheduleModalOpen && (
        <Modal
          isOpen={isScheduleModalOpen}
          onRequestClose={() => setIsScheduleModalOpen(false)}
          style={customStyles}
          ariaHideApp={false}
        >
          <h3>Modificar Horario de Trabajo</h3>
          <label>Horario de inicio: </label>
          <TimePicker
              format="HH:mm"
              placeholder="Selecciona hora"
              value={workSchedule.startTime ? new Date(`1970-01-01T${workSchedule.startTime}:00`) : null}
              onChange={(newValue) => {
                const formattedTime = newValue.toTimeString().slice(0, 5);
                setWorkSchedule({ ...workSchedule, startTime: formattedTime });
              }}
              hideMinutes={(minute) => minute % 30 !== 0} // Solo permite minutos en intervalos de 30
              cleanable={false}
              popupClassName="timepicker-zindex"
              className="block w-full p-2 border border-gray-300 rounded mt-1"
              />
          <br />
          <label>Horario de fin: </label>
          <TimePicker
              format="HH:mm"
              value={workSchedule.endTime ? new Date(`1970-01-01T${workSchedule.endTime}:00`) : null}
              placeholder="Selecciona hora"
              onChange={(newValue) => {
                const formattedTime = newValue.toTimeString().slice(0, 5);
                setWorkSchedule({ ...workSchedule, endTime: formattedTime });
              }}
              hideMinutes={(minute) => minute % 30 !== 0} // Solo permite minutos en intervalos de 30
              cleanable={false}
              popupClassName="timepicker-zindex"
              className="block w-full p-2 border border-gray-300 rounded mt-1"
              />
          <br /><br />
          <button onClick={handleSaveSchedule} className="bg-blue-500 text-white px-4 py-2 rounded">
            Guardar
          </button>
        </Modal>
      )}

      <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          events={appointments}
          editable={true}
          selectable={true} // 🔹 Permite seleccionar rangos de tiempo
          eventDrop={handleEventDrop} // 🔹 Detecta cuando se mueve un evento
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          hiddenDays={[0]} //se elimina el domingo ⚘
          eventContent={(eventInfo) => {

            const eventPatient = patients.find((p) => p._id === eventInfo.event.extendedProps.patient);
            const eventTherapist = therapists.find((t) => t._id === eventInfo.event.extendedProps.therapist);
            const colorStyle = getEventColor(eventInfo.event.title);
            return (
              <div className="custom-event-content">
              <div className="custom-hour">{eventInfo.timeText}</div>
              <div className="custom-title">
              {eventPatient ? `${eventPatient.firstName} ${eventPatient.lastName}` : 'No encontrado'}
              </div>
            </div>
            );
          }}
          slotLabelFormat={{
            hour: "numeric",
            minute: "2-digit",
            meridiem: "short",
            hour12: false,
          }}
          slotMinTime={workSchedule.startTime} // Horario de inicio dinámico
          slotMaxTime={workSchedule.endTime}   // Horario de fin dinámico
          headerToolbar={{
            left: "prev,next today,horario",
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
            horario: "Horario", // Nombre del nuevo botón
          }}
          customButtons={{
            horario: {
              text: "Horario", 
              click: () => setIsScheduleModalOpen(true), // Abre el modal
            },
          }}
        />
      </div>

      {/* Modal de detalles */}
      {modalType === "details" && selectedAppointment && (
        <Modal
          isOpen={modalType === "details"}
          onRequestClose={closeModal}
          style={customStyles}
          ariaHideApp={false}
        >
          <div className="relative">
            <h2 className="text-black font-bold text-xl mb-4">
              {selectedAppointment.description}
            </h2>
            <p className="text-black">
              Paciente: {patients.find((p) => p._id === selectedAppointment.patient)
              ? `${patients.find((p) => p._id === selectedAppointment.patient).firstName} ${
                patients.find((p) => p._id === selectedAppointment.patient).lastName}`: "No encontrado"}
            </p>
            <p className="text-black">Terapeuta: {therapists.find((t) => t._id === selectedAppointment.therapist)
            ? `${therapists.find((t) => t._id === selectedAppointment.therapist).firstName} ${
              therapists.find((t) => t._id === selectedAppointment.therapist).lastName}`: "No encontrado"}
            </p>
            <p className="text-black">Fecha: {selectedAppointment.formattedDate}</p>
            <p className="text-black">
              Hora: {selectedAppointment.formattedStart} - {selectedAppointment.formattedEnd}
            </p>
            <p className="text-black">
              Duracion: {selectedAppointment.duration} mins
            </p>
            <p className="text-black">Costo: ${selectedAppointment.cost}</p>
            <button
              onClick={openEditModal}
              className="mt-4 bg-blue-500 text-white p-2 rounded"
            >
              Editar Cita
            </button>
            <button
              onClick={closeModal}
              className="mt-4 bg-green-500 text-white p-2 rounded absolute top-2 right-2"
            >
              Cerrar
            </button>
            <BotonDeleteCitas id={selectedAppointment.idd} />
          </div>
        </Modal>
      )}

      {/* Modal de edición */}
      {modalType === "edit" && selectedAppointment && (
        <Modal
          isOpen={modalType === "edit"}
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
            appointmentDuration={selectedAppointment.duration}
            cost={selectedAppointment.cost}
            onClose={closeModal}
          />
        </Modal>
      )}
    </div>
  );
};

export default Citas;