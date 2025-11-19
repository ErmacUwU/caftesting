"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.js";
import { useRouter } from "next/navigation";
import { TimePicker, SelectPicker } from "rsuite";
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
import "rsuite/dist/rsuite-no-reset.min.css";

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

  const [services, setServices] = useState([]);

  const [workSchedule, setWorkSchedule] = useState({
    startTime: "08:00:00",
    endTime: "18:00:00",
  });

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

useEffect(() => {
  const fetchData = async () => {
    try {
      const [patientsRes, therapistsRes, appointmentsRes, scheduleRes, serviceRes] =
        await Promise.all([
          axios.get("/api/patient"),
          axios.get("/api/therapist"),
          axios.get("/api/date"),
          axios.get("/api/schedule"),
          axios.get("/api/service"),
        ]);

      const norm = (s) => (s || "").toString().trim();
      const fullName = (p) => `${norm(p.firstName)} ${norm(p.lastName)}`.trim();

      const patientsSorted = [...(patientsRes.data.patient || [])].sort((a, b) =>
        fullName(a).localeCompare(fullName(b), "es", { sensitivity: "base" })
      );

      const therapistsSorted = [...(therapistsRes.data.therapist || [])].sort((a, b) =>
        fullName(a).localeCompare(fullName(b), "es", { sensitivity: "base" })
      );

      const servicesSorted = [...(serviceRes.data.services || [])].sort((a, b) =>
        norm(a.name).localeCompare(norm(b.name), "es", { sensitivity: "base" })
      );

      setServices(servicesSorted);
      setPatients(patientsSorted);
      setTherapists(therapistsSorted);

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
    const newDate = event.start.toISOString().split("T")[0];

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

  const patientsData = (patients || [])
    .map(p => ({
      label: `${p.firstName} ${p.lastName || ""}`.trim(),
      value: p._id
    }))
    .sort((a,b) => a.label.localeCompare(b.label, "es", { sensitivity: "base" }));

  const therapistsData = (therapists || [])
    .map(t => ({
      label: `${t.firstName} ${t.lastName || ""}`.trim(),
      value: t._id
    }))
    .sort((a,b) => a.label.localeCompare(b.label, "es", { sensitivity: "base" }));

  const servicesData = (services || [])
    .map(s => ({
      label: s.name,
      value: s._id
    }))
    .sort((a,b) => a.label.localeCompare(b.label, "es", { sensitivity: "base" }));


  return (
  <div className="min-h-screen bg-slate-50">
    <div className="max-w-7xl mx-auto flex gap-4 py-6 px-4">
      
      {/* Sidebar izquierda */}
      <aside className="w-80 shrink-0 flex flex-col gap-4">
        {/* Tarjeta superior: info rápida */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
          <h2 className="text-sm font-semibold text-slate-800 mb-2">
            Visión general
          </h2>
          <p className="text-xs text-slate-500">
            Haz clic en un hueco del calendario para crear una nueva cita, o selecciona una existente para ver detalles.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-800">
              Nueva cita
            </h2>
            {isFormVisible && (
              <button
                type="button"
                onClick={() => setIsFormVisible(false)}
                className="text-xs text-red-500 hover:text-red-600 font-medium"
              >
                Cerrar
              </button>
            )}
          </div>

          {!isFormVisible && (
            <button
              type="button"
              onClick={() => setIsFormVisible(true)}
              className="w-full text-xs font-semibold bg-sky-500 hover:bg-sky-600 text-white py-2 rounded-lg transition"
            >
              Crear nueva cita
            </button>
          )}

          {isFormVisible && (
            <form onSubmit={handleSubmit} className="mt-2 space-y-3 text-xs citas-form">
              <div>
                <label className="block mb-1 font-medium text-slate-700">
                  Paciente
                </label>
                <SelectPicker
                  data={patientsData}
                  value={selectedPatient}
                  onChange={setSelectedPatient}
                  placeholder="Selecciona paciente"
                  className="block w-full"
                  style={{ width: "100%" }}
                  searchable
                  cleanable={false}
                  placement="autoVerticalStart"
                  menuClassName="z-50"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium text-slate-700">
                  Terapeuta
                </label>
                <SelectPicker
                  data={therapistsData}
                  value={selectedTherapist}
                  onChange={setSelectedTherapist}
                  placeholder="Selecciona terapeuta"
                  className="block w-full"
                  style={{ width: "100%" }}
                  searchable
                  cleanable={false}
                  placement="autoVerticalStart"
                  menuClassName="z-50"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium text-slate-700">
                  Fecha
                </label>
                <input
                  type="date"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  className="block w-full p-2 border border-gray-300 rounded-md text-xs"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium text-slate-700">
                  Hora de inicio
                </label>
                <TimePicker
                  format="HH:mm"
                  placeholder="Selecciona hora"
                  value={
                    appointmentStartTime
                      ? new Date(`2023-01-01T${appointmentStartTime}`)
                      : null
                  }
                  onChange={(newValue) => {
                    if (newValue) {
                      const formattedTime = newValue.toTimeString().slice(0, 5);
                      setAppointmentStartTime(formattedTime);
                      if (selectedService) {
                        const service = services.find(
                          (s) => s._id?.toString() === selectedService
                        );
                        setAppointmentEndTime(
                          calculateEndTime(formattedTime, service?.duration || 0)
                        );
                      }
                    }
                  }}
                  hideMinutes={(minute) => minute % 5 !== 0}
                  cleanable={false}
                  placement="topStart"
                  className="block w-full p-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium text-slate-700">
                  Servicio
                </label>
                <SelectPicker
                  data={servicesData}
                  value={selectedService}
                  onChange={(val) => {
                    setSelectedService(val);
                    const svc = services.find(
                      (s) => s._id?.toString() === String(val)
                    );
                    if (svc) {
                      setAppointmentDuration(svc.duration);
                      setCost(svc.cost);
                      if (appointmentStartTime) {
                        const [hh, mm] = appointmentStartTime
                          .split(":")
                          .map(Number);
                        const end = new Date();
                        end.setHours(hh);
                        end.setMinutes(mm + (svc.duration || 0));
                        const endStr = end.toTimeString().slice(0, 5);
                        setAppointmentEndTime(endStr);
                      }
                    }
                  }}
                  placeholder="Selecciona servicio"
                  className="block w-full"
                  style={{ width: "100%" }}
                  searchable
                  cleanable={false}
                  placement="autoVerticalStart"
                  menuClassName="z-50"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium text-slate-700">
                  Duración (min)
                </label>
                <select
                  value={appointmentDuration}
                  onChange={handleDurationChange}
                  className="block w-full p-2 border rounded-md text-xs bg-white"
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
              </div>

              <div>
                <label className="block mb-1 font-medium text-slate-700">
                  Hora de cierre
                </label>
                <TimePicker
                  format="HH:mm"
                  placeholder="Selecciona hora"
                  value={
                    appointmentEndTime
                      ? new Date(`2023-01-01T${appointmentEndTime}`)
                      : null
                  }
                  onChange={(newValue) => {
                    if (newValue) {
                      const formattedTime = newValue.toTimeString().slice(0, 5);
                      setAppointmentEndTime(formattedTime);
                    }
                  }}
                  hideMinutes={(minute) => minute % 5 !== 0}
                  cleanable={false}
                  placement="topStart"
                  className="block w-full p-2 border border-gray-300 rounded-md"
                  disabled
                />
              </div>

              <div>
                <label className="block mb-1 font-medium text-slate-700">
                  Costo
                </label>
                <input
                  type="number"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  className="block w-full p-2 border rounded-md text-xs bg-white"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 rounded-lg text-xs mt-1"
              >
                Crear cita
              </button>
            </form>
          )}
        </div>
      </aside>

      {/* Columna principal: calendario */}
      <main className="flex-1">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-3">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-slate-800">
                Agenda semanal
              </h1>
              <p className="text-xs text-slate-500">
                Vista general de las citas programadas.
              </p>
            </div>
          </div>

          <div className="calendar-container">
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
      </main>
    </div>

    {/* Modal de horario (el mismo que ya tenías) */}
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
          value={
            workSchedule.startTime
              ? new Date(`1970-01-01T${workSchedule.startTime}:00`)
              : null
          }
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
          value={
            workSchedule.endTime
              ? new Date(`1970-01-01T${workSchedule.endTime}:00`)
              : null
          }
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
        <button
          onClick={handleSaveSchedule}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Guardar
        </button>
      </Modal>
    )}

    {/* Modal de detalles — versión limpia y clara */}
    {modalType === "details" && selectedAppointment && (
      <Modal
        isOpen={true}
        onRequestClose={closeModal}
        ariaHideApp={false}
        style={{
          overlay: {
            backgroundColor: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(6px)",
            zIndex: 2000,
          },
          content: {
            top: "50%",
            left: "50%",
            right: "auto",
            bottom: "auto",
            transform: "translate(-50%, -50%)",
            padding: "24px",
            width: "420px",
            maxWidth: "90%",
            borderRadius: "16px",
            border: "1px solid #e5e7eb",
            background: "#ffffff",
            color: "#1f2937",
            boxShadow: "0 15px 35px rgba(0,0,0,0.20)",
          },
        }}
      >

        {/* Botón cerrar */}
        <button
          onClick={closeModal}
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            background: "#e5e7eb",
            width: "30px",
            height: "30px",
            borderRadius: "50%",
            border: "none",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          ✕
        </button>

        {/* Título */}
        <h2 className="text-xl font-bold mb-4 text-slate-800">
          {selectedAppointment?.title || "Detalle de la cita"}
        </h2>

        {/* Información */}
        <div className="space-y-2 text-slate-700">
          <p>
            <strong>Paciente:</strong>{" "}
            {(() => {
              const p = selectedAppointment.patient;
              if (typeof p === "object" && p.firstName) {
                return `${p.firstName} ${p.lastName}`;
              }
              const found = patients.find((x) => x._id === p);
              return found ? `${found.firstName} ${found.lastName}` : "No encontrado";
            })()}
          </p>

          <p>
            <strong>Terapeuta:</strong>{" "}
            {(() => {
              const t = selectedAppointment.therapist;
              if (typeof t === "object" && t.firstName) {
                return `${t.firstName} ${t.lastName}`;
              }
              const found = therapists.find((x) => x._id === t);
              return found ? `${found.firstName} ${found.lastName}` : "No encontrado";
            })()}
          </p>

          <p><strong>Fecha:</strong> {selectedAppointment.formattedDate}</p>

          <p>
            <strong>Hora:</strong>{" "}
            {selectedAppointment.formattedStart} – {selectedAppointment.formattedEnd}
          </p>

          <p><strong>Duración:</strong> {selectedAppointment.duration} minutos</p>
          <p><strong>Costo:</strong> ${selectedAppointment.cost}</p>
        </div>

        {/* Botones */}
        <div className="flex justify-end mt-5 gap-3">
          <button
            onClick={openEditModal}
            className="bg-blue-600 text-white px-4 py-2 rounded-md"
          >
            Editar
          </button>

          <BotonDeleteCitas id={selectedAppointment.idd} />
        </div>

      </Modal>
    )}

    {/* Modal de edición — mismo estilo claro que detalles */}
    {modalType === "edit" && selectedAppointment && (
      <Modal
        isOpen={true}
        onRequestClose={closeModal}
        ariaHideApp={false}
        shouldCloseOnOverlayClick={true}
        onAfterOpen={() => (document.body.style.overflow = "hidden")}
        onAfterClose={() => (document.body.style.overflow = "auto")}
        style={{
          overlay: {
            backgroundColor: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(6px)",
            zIndex: 2100,
          },
          content: {
            top: "50%",
            left: "50%",
            right: "auto",
            bottom: "auto",
            transform: "translate(-50%, -50%)",
            padding: "24px",
            width: "480px",
            maxWidth: "95%",
            maxHeight: "90vh",
            overflowY: "auto",
            borderRadius: "16px",
            border: "1px solid #e5e7eb",
            background: "#ffffff",
            color: "#1f2937",
            boxShadow: "0 15px 35px rgba(0,0,0,0.20)",
          },
        }}
      >
        <div className="relative text-slate-800">
          {/* Botón cerrar */}
          <button
            onClick={closeModal}
            className="absolute top-2 right-2 bg-gray-200 hover:bg-gray-300 text-gray-800 p-1 rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold"
          >
            ✕
          </button>

          <h2 className="text-lg font-bold mb-3">
            Editar cita
          </h2>

          {/* Aquí va tu formulario de edición */}
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