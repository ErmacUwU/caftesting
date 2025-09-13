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

const customEditStyles = {
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 1000,
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  content: {
    position: "fixed",
    top: "50%",
    right: "20px",
    transform: "translateY(-50%)",
    width: "400px",
    maxHeight: "90vh",
    margin: 0,
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    overflowY: "auto",
    zIndex: 1001,
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
  const [calKey, setCalKey] = useState(0);

  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [modalType, setModalType] = useState(null); // "details" o "edit"
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // servicios
  const [services, setServices] = useState([]);

  const [workSchedule, setWorkSchedule] = useState({
    startTime: "08:00:00", // Inicio de jornada
    endTime: "18:00:00", // Fin de jornada
  });

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [patientsRes, therapistsRes, appointmentsRes, scheduleRes, serviceRes] = await Promise.all([
          axios.get("/api/patient"),
          axios.get("/api/therapist"),
          axios.get("/api/date"),
          axios.get("/api/schedule"),
          axios.get("/api/service"),
        ]);

        setServices(serviceRes.data.services || []);
        setPatients(patientsRes.data.patient || []);
        setTherapists(therapistsRes.data.therapist || []);

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

  // Cargar citas coloreadas por servicio cuando ya hay services
  useEffect(() => {
    if (services.length === 0) return;

    const fetchAppointments = async () => {
      try {
        const response = await axios.get("/api/date");
        const appointmentData = response.data?.date || [];

        const colorAppointments = appointmentData.map((appointment) => {
          const service = services.find((s) => s.name === appointment.title);
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
            backgroundColor: service?.color || "#bdc3c7",
            borderColor: "#000",
            serviceId: appointment.serviceId,
          };
        });
        setAppointments(colorAppointments);
      } catch (error) {
        console.error("Error cargando citas:", error);
      }
    };
    fetchAppointments();
  }, [services]);

  // Refrescar citas post
  const refetchAppointments = async () => {
    try {
      const response = await axios.get("/api/date");
      const appointmentData = response.data?.date || [];

      const colorAppointments = appointmentData.map((appointment) => {
        let service = services.find((s) => s._id.toString() === appointment.serviceId?.toString());
        if (!service && appointment.title) {
          service = services.find((s) => s.name === appointment.title);
        }
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
          backgroundColor: service?.color || "#bdc3c7",
          borderColor: "#000",
          serviceId: appointment.serviceId,
        };
      });
      setAppointments(colorAppointments);
    } catch (error) {
      console.error("Error cargando citas:", error);
    }
  };

  //Autenticación
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
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

  const getEventColor = (serviceName) => {
    const service = services.find((s) => s.name === serviceName);
    return {
      backgroundColor: service?.color || "#bdc3c7",
      borderColor: "#000",
    };
  };

  const calculateEndTime = (startTime, duration) => {
    if (!startTime || !duration) return "";
    const [hours, minutes] = startTime.split(":").map(Number);
    const endMinutes = minutes + duration;
    const endHours = hours + Math.floor(endMinutes / 60);
    return `${String(endHours).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`;
  };

  // Actualizar duración y hora de fin automáticamente
  const handleDurationChange = (e) => {
    let newDuration = parseInt(e.target.value, 10);
    if (newDuration > 120) newDuration = 120;
    if (newDuration < 0) newDuration = 0;

    setAppointmentDuration(newDuration);
    if (appointmentStartTime) {
      setAppointmentEndTime(calculateEndTime(appointmentStartTime, newDuration));
    }
  };

  const handleServiceChange = (e) => {
    const selectedServiceId = e.target.value;
    setSelectedService(selectedServiceId);

    const service = services.find((s) => s._id?.toString() === selectedServiceId);
    if (service) {
      setAppointmentDuration(service.duration);
      setCost(service.cost);
      if (appointmentStartTime) {
        setAppointmentEndTime(calculateEndTime(appointmentStartTime, service.duration));
      }
    }
  };

  const convertToLocalDate = (dateStr, timeStr) => {
    const [year, month, day] = dateStr.split("-");
    const [hours, minutes] = timeStr.split(":");
    if (!year || !month || !day || !hours || !minutes) return null;
    return new Date(Number(year), Number(month) - 1, Number(day), Number(hours), Number(minutes));
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  // Eliminar domingos
  const selectedDate = new Date(appointmentDate);
  if (selectedDate.getUTCDay() === 0) {
    alert("No se puede registrar citas en domingo");
    return;
  }

  const therapist = therapists.find((t) => t._id === selectedTherapist);
  const patient = patients.find((p) => p._id === selectedPatient);
  const service  = services.find((s) => s._id?.toString() === selectedService);

  const appointmentData = {
    idDate: uniquid(),
    date: appointmentDate,
    start: convertToLocalDate(appointmentDate, appointmentStartTime),
    end:   convertToLocalDate(appointmentDate, appointmentEndTime),
    duration: appointmentDuration,
    therapist,
    patient,
    title: service?.name || "",
    description: service?.name || "",
    cost: Number(cost),
    serviceId: service?._id,
  };

  let postOk = false;

  try {
    const { data: created } = await axios.post("/api/date", appointmentData);

    setAppointments((prev) => ([
      ...prev,
      {
        idd: created._id,
        id: created.idDate,
        title: created.title,
        start: new Date(created.start),
        end: new Date(created.end),
        duration: created.duration,
        description: created.description,
        therapist: created.therapist,
        patient: created.patient,
        cost: created.cost,
        serviceId: created.serviceId,
        backgroundColor: service?.color || "#bdc3c7",
        borderColor: "#000",
      },
    ]));

    postOk = true;

    try {
      await axios.patch(`/api/patient/${selectedPatient}`, {
        nuevaCita: {
          fecha: new Date(`${appointmentDate}T00:00:00`).toISOString(),
          costo: Number(cost),
        },
      });
    } catch (patchErr) {
      console.warn("PATCH /api/patient falló (no bloquea la UI):", patchErr);
    }

  } catch (error) {
    console.error("Error creando cita:", error);
    return;
  } finally {
    if (postOk) {
      await refetchAppointments();
      setCalKey((k) => k + 1);
    }
  }

  setSelectedPatient("");
  setSelectedTherapist("");
  setAppointmentDate("");
  setAppointmentStartTime("");
  setAppointmentEndTime("");
  setAppointmentDuration("");
  setSelectedService("");
  setCost("");
  setIsFormVisible(false);
};


  const handleEventClick = (info) => {
    const appointment = appointments.find((app) => app.id === info.event.id);
    if (appointment) {
      setSelectedAppointment({
        ...appointment,
        formattedDate: appointment.start.toLocaleDateString("es-ES"),
        formattedStart: appointment.start.toTimeString().slice(0, 5),
        formattedEnd: appointment.end.toTimeString().slice(0, 5),
      });
      setModalType("details");
    }
  };

  const handleEventDrop = async (eventDropInfo) => {
    const { event } = eventDropInfo;
    const newDate = event.start.toISOString().split("T")[0]; // YYYY-MM-DD

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
    const clickedDate = info.date;
    const dayWeek = clickedDate.getDay();
    if (dayWeek === 0) {
      alert("No se pueden crear citas los domingos");
      return;
    }
    const fecha = clickedDate.toLocaleDateString("sv-SE");
    const hora = clickedDate.toTimeString().slice(0, 5);

    setAppointmentDate(fecha);
    setAppointmentStartTime(hora);

    const service = services.find((serv) => serv._id.toString() === selectedService);
    if (service) {
      setAppointmentEndTime(calculateEndTime(hora, service.duration));
    }
    setIsFormVisible(true);
  };

  const renderEventContent = (eventInfo) => {
    const colorStyle = getEventColor(eventInfo.event.title);
    const patientProp = eventInfo.event.extendedProps.patient;
    let patientName = "No encontrado";

    if (patientProp && typeof patientProp === "object" && patientProp.firstName) {
      patientName = `${patientProp.firstName} ${patientProp.lastName || ""}`.trim();
    } else if (patientProp && typeof patientProp === "string") {
      const p = patients.find((pp) => pp._id === patientProp);
      if (p) patientName = `${p.firstName} ${p.lastName}`;
    }

    return (
      <div className="custom-event-content text-white" style={colorStyle}>
        <div className="custom-hour">{eventInfo.timeText}</div>
        <div className="custom-title">{patientName}</div>
      </div>
    );
  };

  return (
    // contenedor centrado mas dos columnas
    <div className="flex items-center justify-center h-screen text-center">

      {/* Panel lateral */}
      {isFormVisible && (
        <div className="w-1/3 min-w-[300px] p-4 shadow-lg z-20 sticky top-0 h-screen overflow-y-auto ">
          <button
            onClick={() => setIsFormVisible(false)}
            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded"
          >
            X
          </button>
          <form onSubmit={handleSubmit} className="mb-4 text-white citas-form">
            <label className="block mb-2">
              Paciente:
              <select
                value={selectedPatient}
                onChange={(e) => setSelectedPatient(e.target.value)}
                className="block w-full p-2 border rounded mt-1 text-black bg-white"
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
                className="block w-full p-2 border rounded mt-1 text-black bg-white"
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

            <label className="block mb-2 ">
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
                      const service = services.find((s) => s._id?.toString() === selectedService);
                      setAppointmentEndTime(calculateEndTime(formattedTime, service?.duration || 0));
                    }
                  }
                }}
                hideMinutes={(minute) => minute % 5 !== 0}
                cleanable={false}
                placement="topStart"
                className="block w-full p-2 border border-gray-300  rounded mt-1"
              />
            </label>

            <label className="block mb-2">
              Servicio:
              <select
                value={selectedService}
                onChange={handleServiceChange}
                className="block w-full p-2 border rounded mt-1 text-black bg-white"
              >
                <option value="">Seleccione un servicio</option>
                {services.map((service) => (
                  <option key={service._id} value={service._id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block mb-2">Duración de la Cita (minutos):</label>
            <select
              value={appointmentDuration}
              onChange={handleDurationChange}
              className="block w-full p-2 border rounded mt-1 text-black bg-white"
            >
              {[...Array(25)].map((_, i) => {
                const minutes = (i + 1) * 5;
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
                className="block w-full p-2 border rounded mt-1 text-black bg-white"
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
    <div className="dual-cal-wrapper flex items-center justify-center h-screen text-center gap-16">
        {/* Columna 1 */}
        <div className="w-1/2">
          <div className="calendar-container p-4">
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
                hideMinutes={(minute) => minute % 30 !== 0}
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
                hideMinutes={(minute) => minute % 30 !== 0}
                cleanable={false}
                popupClassName="timepicker-zindex"
                className="block w-full p-2 border border-gray-300 rounded mt-1"
              />
              <br />
              <br />
              <button onClick={handleSaveSchedule} className="bg-blue-500 text-white px-4 py-2 rounded">
                Guardar
              </button>
            </Modal>
          )}

          <FullCalendar
            key={calKey}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            events={appointments}
            editable={true}
            selectable={true}
            eventDrop={handleEventDrop}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            hiddenDays={[0]}
            eventContent={renderEventContent}
            slotLabelFormat={{
              hour: "numeric",
              minute: "2-digit",
              meridiem: "short",
              hour12: false,
            }}
            slotMinTime={workSchedule.startTime}
            slotMaxTime={workSchedule.endTime}
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
              horario: "Horario",
            }}
            customButtons={{
              horario: {
                text: "Horario",
                click: () => setIsScheduleModalOpen(true),
              },
            }}
          />
        </div>
      </div>

      {/* Columna 2 */}
      <div className="w-1/2">
        <div className="calendar-container p-4">
          <FullCalendar
            key={calKey}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            events={appointments}
            editable={true}
            selectable={true}
            eventDrop={handleEventDrop}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            hiddenDays={[0]}
            eventContent={renderEventContent}
            slotLabelFormat={{
              hour: "numeric",
              minute: "2-digit",
              meridiem: "short",
              hour12: false,
            }}
            slotMinTime={workSchedule.startTime}
            slotMaxTime={workSchedule.endTime}
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
              horario: "Horario",
            }}
            customButtons={{
              horario: {
                text: "Horario",
                click: () => setIsScheduleModalOpen(true),
              },
            }}
          />
        </div>
      </div>
    </div>

      {/* Modal de detalles */}
      {modalType === "details" && selectedAppointment && (
        <Modal isOpen={modalType === "details"} onRequestClose={closeModal} style={customStyles} ariaHideApp={false}>
          <div className="relative">
            <h2 className="text-white font-bold text-xl mb-4">{selectedAppointment.description}</h2>
            <p className="text-black">
              Paciente:{" "}
              {(() => {
                // Soportar objeto poblado o id
                const p = selectedAppointment.patient;
                if (p && typeof p === "object" && p.firstName) return `${p.firstName} ${p.lastName || ""}`.trim();
                const found = patients.find((pp) => pp._id === p);
                return found ? `${found.firstName} ${found.lastName}` : "No encontrado";
              })()}
            </p>
            <p className="text-black">
              Terapeuta:{" "}
              {(() => {
                const t = selectedAppointment.therapist;
                if (t && typeof t === "object" && t.firstName) return `${t.firstName} ${t.lastName || ""}`.trim();
                const found = therapists.find((tt) => tt._id === t);
                return found ? `${found.firstName} ${found.lastName}` : "No encontrado";
              })()}
            </p>
            <p className="text-black">Fecha: {selectedAppointment.formattedDate}</p>
            <p className="text-black">
              Hora: {selectedAppointment.formattedStart} - {selectedAppointment.formattedEnd}
            </p>
            <p className="text-black">Duración: {selectedAppointment.duration} mins</p>
            <p className="text-black">Costo: ${selectedAppointment.cost}</p>
            <button onClick={openEditModal} className="mt-4 bg-blue-500 text-white p-2 rounded">
              Editar Cita
            </button>
            <button onClick={closeModal} className="mt-4 bg-green-500 text-white p-2 rounded absolute top-2 right-2">
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
          shouldCloseOnOverlayClick={true}
          onAfterOpen={() => (document.body.style.overflow = "hidden")}
          onAfterClose={() => (document.body.style.overflow = "auto")}
        >
          <div className="relative">
            <button
              onClick={closeModal}
              className="absolute top-2 right-2 bg-gray-500 text-white p-1 rounded-full w-6 h-6 flex items-center justify-center"
            >
              X
            </button>
            <ActualizarCita
              id={selectedAppointment.idd}
              selectedPatient={
                typeof selectedAppointment.patient === "object"
                  ? selectedAppointment.patient
                  : patients.find((p) => p._id === selectedAppointment.patient)
              }
              selectedTherapist={
                typeof selectedAppointment.therapist === "object"
                  ? selectedAppointment.therapist
                  : therapists.find((t) => t._id === selectedAppointment.therapist)
              }
              selectedService={selectedAppointment.serviceId}
              appointmentDate={selectedAppointment.start.toISOString().split("T")[0]}
              appointmentStartTime={selectedAppointment.start.toTimeString().slice(0, 5)}
              appointmentEndTime={selectedAppointment.end.toTimeString().slice(0, 5)}
              appointmentDuration={selectedAppointment.duration}
              cost={selectedAppointment.cost}
              onClose={closeModal}
              onUpdate={refetchAppointments}
            />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Citas;