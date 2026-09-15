"use client";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "../context/AuthContext.js";
import { useRouter } from "next/navigation";
import { TimePicker, SelectPicker } from "rsuite";
import axios from "axios";
import uniquid from "uniquid";
import Modal from "react-modal";
import ActualizarCita from "../components/ActualizarCitas";
import BotonDeleteCitas from "../components/BotonDeleteCitas";
import Spinner from "../components/Spinner";
import useDebounce from "@/hooks/useDebounce";
import "./app.css";
import "rsuite/dist/rsuite-no-reset.min.css";
import {
  CLINIC_TIMEZONE,
  zonedTimeToUtc,
  formatZonedDate,
  formatZonedTime,
  toFullCalendarDate,
  fromFullCalendarDate,
} from "@/lib/clinicTime";

// Carga perezosa: FullCalendar (+ sus plugins) es pesado y solo se
// necesita en esta vista, así que se separa en su propio chunk en vez de
// sumarse al bundle inicial de la Agenda.
const FullCalendarView = dynamic(() => import("./FullCalendarView"), {
  ssr: false,
  loading: () => <Spinner label="Cargando calendario..." />,
});

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

  // NUEVO: terapeutas que se muestran en el calendario
  // No afecta al terapeuta seleccionado para crear/editar una cita.
  const [selectedCalendarTherapists, setSelectedCalendarTherapists] = useState([]);
  const [therapistFilterSearch, setTherapistFilterSearch] = useState("");
  // Se filtra con el valor "asentado" (300ms) para no recalcular la lista
  // en cada tecla; el input en sí sigue mostrando lo que se escribe al instante.
  const debouncedTherapistFilterSearch = useDebounce(therapistFilterSearch, 300);

  const [selectedPatient, setSelectedPatient] = useState("");
  const [selectedTherapist, setSelectedTherapist] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentStartTime, setAppointmentStartTime] = useState(null);
  const [appointmentEndTime, setAppointmentEndTime] = useState(null);
  const [appointmentDuration, setAppointmentDuration] = useState(0);
  const [selectedService, setSelectedService] = useState("");
  const [cost, setCost] = useState("");
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [calKey, setCalKey] = useState(0);

  // --- Citas recurrentes ---
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState("weekly");
  const [recurrenceWeeks, setRecurrenceWeeks] = useState(4);

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

  // Obtiene el nombre usando firstName y lastName del perfil correspondiente.
  const getFullName = useCallback((user) => {
    const profile = user?.patientProfile || user?.therapistProfile || user || {};
    return `${profile.firstName || ""} ${profile.lastName || ""}`.trim() || user?.email || "Sin nombre";
  }, []);

useEffect(() => {
  const fetchData = async () => {
    try {
      // Antes se pedía también "/api/date" aquí (las citas completas, sin
      // filtrar), pero esa respuesta nunca se usaba: las citas las carga
      // el efecto de abajo, ya filtradas por rango de fechas visible. Se
      // quita esa quinta petición redundante del montaje.
      const [patientsRes, therapistsRes, scheduleRes, serviceRes] =
        await Promise.all([
          axios.get("/api/usuarioTrue?role=patient"), // Filtra por rol paciente
          axios.get("/api/usuarioTrue?role=therapist"), // Filtra por rol terapeuta
          axios.get("/api/schedule"),
          axios.get("/api/service"),
        ]);

      const norm = (s) => (s || "").toString().trim();

// Extraer las listas (considerando que el backend puede devolver {users: []} o [])
const listaP = patientsRes.data.users || patientsRes.data;
const listaT = therapistsRes.data.users || therapistsRes.data;

setPatients([...listaP].sort((a, b) => getFullName(a).localeCompare(getFullName(b))));
setTherapists([...listaT].sort((a, b) => getFullName(a).localeCompare(getFullName(b))));

      // Al cargar la página, todos los terapeutas aparecen seleccionados.
      setSelectedCalendarTherapists(
        [...listaT].map((therapist) => therapist._id.toString())
      );

  
      const servicesSorted = [...(serviceRes.data.services || [])].sort((a, b) =>
        norm(a.name).localeCompare(norm(b.name), "es", { sensitivity: "base" })
      );

    
      setServices(servicesSorted);

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


  // Rango de fechas que el calendario tiene visible ahora mismo (semana o
  // día), en instantes UTC reales. Se actualiza vía el callback `datesSet`
  // de FullCalendar cada vez que el usuario navega (prev/next, cambia de
  // vista, etc.) y se usa para pedir a /api/date SOLO las citas de ese
  // rango en vez de la colección completa — antes se traían TODAS las
  // citas de la base de datos en cada carga, lo cual dominaba el tiempo de
  // respuesta conforme crecía el histórico.
  const [visibleRange, setVisibleRange] = useState(null);

  const handleDatesSet = useCallback((arg) => {
    // arg.start/arg.end vienen "disfrazados" (el calendario corre con
    // timeZone="UTC"); hay que devolverlos a su instante UTC real antes de
    // usarlos como parámetros de la API, igual que con eventDrop.
    const realStart = fromFullCalendarDate(arg.start, CLINIC_TIMEZONE);
    const realEnd = fromFullCalendarDate(arg.end, CLINIC_TIMEZONE);
    const start = realStart.toISOString();
    const end = realEnd.toISOString();
    // FullCalendar puede volver a llamar datesSet aunque el rango visible
    // no haya cambiado en realidad (p. ej. al re-renderizar Citas, ya que
    // headerToolbar/buttonText/customButtons se recrean como objetos
    // nuevos en cada render). Si no se filtra por valor aquí, ese
    // "no-cambio" dispara setVisibleRange -> re-render -> nuevas props ->
    // datesSet de nuevo, un ciclo infinito ("Maximum update depth
    // exceeded"). Comparando por valor, solo se actualiza el estado (y por
    // tanto se refetch) cuando el rango realmente cambió.
    setVisibleRange((prev) =>
      prev && prev.start === start && prev.end === end ? prev : { start, end }
    );
  }, []);

  // Cargar citas coloreadas por servicio cuando ya hay services Y ya
  // sabemos qué rango de fechas está viendo el usuario.
  useEffect(() => {
    if (services.length === 0 || !visibleRange) return;

    const fetchAppointments = async () => {
      try {
        const response = await axios.get("/api/date", { params: visibleRange });
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
            recurrenceGroupId: appointment.recurrenceGroupId || null,
          };
        });
        setAppointments(colorAppointments);
      } catch (error) {
        console.error("Error cargando citas:", error);
      }
    };
    fetchAppointments();
  }, [services, visibleRange]);

  // Refrescar citas post (crear/editar/borrar/mover): mismo rango visible
  // que ya se le pidió al calendario, no la colección completa.
  const refetchAppointments = async () => {
    try {
      const response = await axios.get("/api/date", {
        params: visibleRange || undefined,
      });
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
          recurrenceGroupId: appointment.recurrenceGroupId || null,
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

  const getEventColor = useCallback(
    (serviceName) => {
      const service = services.find((s) => s.name === serviceName);
      return {
        backgroundColor: service?.color || "#bdc3c7",
        borderColor: "#000",
      };
    },
    [services]
  );

  const calculateEndTime = useCallback((startTime, duration) => {
    if (!startTime || !duration) return "";
    const [hours, minutes] = startTime.split(":").map(Number);
    const endMinutes = minutes + duration;
    const endHours = hours + Math.floor(endMinutes / 60);
    return `${String(endHours).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`;
  }, []);

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

  // IMPORTANTE: la fecha/hora que el usuario teclea o selecciona en el
  // formulario representa siempre la hora de la CLÍNICA (America/Tijuana),
  // sin importar en qué zona horaria esté el navegador de quien la crea.
  // Antes se interpretaba con la zona horaria local del navegador, lo que
  // hacía que la misma cita se guardara en un instante distinto según quién
  // la registrara (p. ej. México vs. Filipinas).
  const convertToLocalDate = (dateStr, timeStr) => {
    return zonedTimeToUtc(dateStr, timeStr, CLINIC_TIMEZONE);
  };

  // Suma días a una fecha "YYYY-MM-DD" y devuelve el resultado en el mismo formato.
  // Se usa para generar las fechas de las citas recurrentes (una por semana).
  const addDaysToDateString = (dateStr, days) => {
    const [year, month, day] = dateStr.split("-").map(Number);
    const dt = new Date(year, month - 1, day);
    dt.setDate(dt.getDate() + days);
    const yyyy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const dd = String(dt.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  // 1. Validaciones iniciales
  if (!selectedPatient || !selectedTherapist || !selectedService) {
    alert("Por favor rellena todos los campos obligatorios (Paciente, Terapeuta y Servicio)");
    return;
  }

  // Validar domingos
  const selectedDate = new Date(appointmentDate);
  if (selectedDate.getUTCDay() === 0) {
    alert("No se pueden registrar citas en domingo");
    return;
  }

  // Validar configuración de recurrencia
  if (isRecurring && (!recurrenceWeeks || Number(recurrenceWeeks) < 2)) {
    alert("Indica un número de semanas válido (mínimo 2) para la cita recurrente");
    return;
  }

  // 2. Buscar los objetos completos en las listas que cargamos de UsuarioTrue
  // Esto es para obtener nombres, colores de servicio, etc.
  const patientData = patients.find((p) => p._id === selectedPatient);
  const therapistData = therapists.find((t) => t._id === selectedTherapist);
  const service = services.find((s) => s._id?.toString() === selectedService);

  // 3. Generamos las ocurrencias: 1 sola cita, o varias si es recurrente
  // (una por semana, compartiendo un recurrenceGroupId para vincularlas).
  const totalOccurrences = isRecurring ? Math.max(1, Number(recurrenceWeeks)) : 1;
  const recurrenceGroupId = isRecurring ? uniquid() : null;

  const occurrencesData = Array.from({ length: totalOccurrences }, (_, i) => {
    const occurrenceDate =
      i === 0 ? appointmentDate : addDaysToDateString(appointmentDate, i * 7);

    return {
      idDate: uniquid(),
      date: occurrenceDate,
      start: convertToLocalDate(occurrenceDate, appointmentStartTime),
      end: convertToLocalDate(occurrenceDate, appointmentEndTime),
      duration: appointmentDuration,
      patient: selectedPatient,   // Enviamos el ID del UsuarioTrue
      therapist: selectedTherapist, // Enviamos el ID del UsuarioTrue
      title: service?.name || "Cita Médica",
      description: service?.name || "",
      cost: Number(cost),
      serviceId: selectedService,
      recurrenceGroupId,
    };
  });

  // LOG DE DIAGNÓSTICO: Revisa esto en la consola (F12)
  console.log("Enviando cita(s) a la API:", occurrencesData);

  let postOk = false;

  try {
    // 4. Guardar la(s) cita(s) en /api/date
    // - Cita única: mismo payload de siempre (objeto plano).
    // - Cita recurrente: se envían todas las ocurrencias juntas bajo `occurrences`.
    const { data: created } = isRecurring
      ? await axios.post("/api/date", { occurrences: occurrencesData })
      : await axios.post("/api/date", occurrencesData[0]);

    console.log("Respuesta del servidor (Cita creada):", created);
    postOk = true;

    // 5. Actualizar el perfil del Paciente en UsuarioTrue (Historial de citas)
    // Se registra una entrada de historial por cada ocurrencia creada.
    for (const occ of occurrencesData) {
      try {
        await axios.patch(`/api/usuarioTrue/${selectedPatient}`, {
          isAccountUpdate: false, // Indica que no es cambio de contraseña/email, sino de perfil
          nuevaCita: {
            fecha: new Date(`${occ.date}T00:00:00`).toISOString(),
            costo: Number(cost),
          },
        });
      } catch (patchErr) {
        console.warn("La cita se creó, pero no se pudo actualizar el historial del paciente:", patchErr);
      }
    }
    console.log("Historial del paciente actualizado correctamente");

  } catch (error) {
    console.error("Error crítico al crear la cita:", error);
    alert("Error al guardar la cita. Revisa la consola.");
    return;
  } finally {
    // 6. Si todo salió bien, refrescamos y limpiamos
    if (postOk) {
      await refetchAppointments();
      setCalKey((k) => k + 1); // Forzar refresco del calendario

      // Limpiar formulario
      setSelectedPatient("");
      setSelectedTherapist("");
      setAppointmentDate("");
      setAppointmentStartTime("");
      setAppointmentEndTime("");
      setAppointmentDuration("");
      setSelectedService("");
      setCost("");
      setIsFormVisible(false);
      setIsRecurring(false);
      setRecurrenceFrequency("weekly");
      setRecurrenceWeeks(4);

      alert(
        isRecurring
          ? `Se registraron ${occurrencesData.length} citas recurrentes exitosamente`
          : "Cita registrada exitosamente"
      );
    }
  }
};


  const handleEventClick = useCallback((info) => {
    const appointment = appointments.find((app) => app.id === info.event.id);
    if (appointment) {
      // Se formatea en la zona horaria de la clínica (no la del navegador)
      // para que todos los usuarios vean la misma fecha/hora de la cita.
      setSelectedAppointment({
        ...appointment,
        formattedDate: appointment.start.toLocaleDateString("es-ES", {
          timeZone: CLINIC_TIMEZONE,
        }),
        formattedStart: formatZonedTime(appointment.start, CLINIC_TIMEZONE),
        formattedEnd: formatZonedTime(appointment.end, CLINIC_TIMEZONE),
      });
      setModalType("details");
    }
  }, [appointments]);

  const handleEventDrop = useCallback(async (eventDropInfo) => {
    const { event } = eventDropInfo;
    // event.start/end vienen "disfrazados" (calendario en timeZone="UTC");
    // hay que reconvertirlos al instante UTC real de la clínica antes de
    // persistirlos, igual que al crear una cita.
    const realStart = fromFullCalendarDate(event.start, CLINIC_TIMEZONE);
    const realEnd = fromFullCalendarDate(event.end, CLINIC_TIMEZONE);
    const newDate = realStart.toISOString().split("T")[0];

    try {
      // La API espera { date, start, end } (mismo contrato que usa
      // ActualizarCita.jsx) — antes se enviaba { newDate, newStart, newEnd },
      // nombres que el handler PUT no reconocía, así que la cita se movía
      // visualmente pero nunca se guardaba el nuevo horario.
      const response = await axios.put(`/api/date/${event.extendedProps.idd}`, {
        date: newDate,
        start: realStart.toISOString(),
        end: realEnd.toISOString(),
      });
      console.log("Evento actualizado en la base de datos:", response.data);
    } catch (error) {
      console.error("Error al actualizar evento:", error);
    }
  }, []);

  const closeModal = useCallback(() => {
    setSelectedAppointment(null);
    setModalType(null);
  }, []);

  const openEditModal = useCallback(() => {
    setModalType("edit");
  }, []);

  const handleDateClick = useCallback((info) => {
    // El calendario corre con timeZone="UTC" recibiendo fechas "disfrazadas"
    // (ver toFullCalendarDate), así que los getters UTC de info.date ya dan
    // directamente la fecha/hora de pared de la clínica, igual para
    // cualquier usuario sin importar su propia zona horaria.
    const clickedDate = info.date;
    const dayWeek = clickedDate.getUTCDay();
    if (dayWeek === 0) {
      alert("No se pueden crear citas los domingos");
      return;
    }
    const fecha = `${clickedDate.getUTCFullYear()}-${String(
      clickedDate.getUTCMonth() + 1
    ).padStart(2, "0")}-${String(clickedDate.getUTCDate()).padStart(2, "0")}`;
    const hora = `${String(clickedDate.getUTCHours()).padStart(
      2,
      "0"
    )}:${String(clickedDate.getUTCMinutes()).padStart(2, "0")}`;

    setAppointmentDate(fecha);
    setAppointmentStartTime(hora);

    const service = services.find((serv) => serv._id.toString() === selectedService);
    if (service) {
      setAppointmentEndTime(calculateEndTime(hora, service.duration));
    }
    setIsFormVisible(true);
  }, [services, selectedService, calculateEndTime]);

 const renderEventContent = useCallback((eventInfo) => {
  const colorStyle = getEventColor(eventInfo.event.title);
  // 1. Intentamos obtener el paciente de extendedProps
  const patientProp = eventInfo.event.extendedProps.patient;
  
  let patientName = "No asig";

  // 2. Lógica de resolución de nombre
  if (patientProp) {
    let p = null;

    // Si patientProp YA ES EL OBJETO (a veces FullCalendar lo deserializa)
    if (typeof patientProp === "object" && patientProp.firstName) {
       p = patientProp;
    }
    // Si es un objeto del nuevo modelo (UserTrue)
    else if (typeof patientProp === "object" && patientProp.patientProfile) {
       p = patientProp.patientProfile;
    }
    // Si es un ID, lo buscamos en la lista global 'patients'
    else {
       const found = patients.find((pp) => pp._id === patientProp || pp._id === patientProp?._id);
       if (found) {
         p = found.patientProfile || found;
       }
    }

    // 3. Formateo final
    if (p) {
      const first = p.firstName || "";
      const last = p.lastName || "";
      if (first || last) {
        patientName = `${first} ${last}`.trim();
      }
    }
  }                  

  return (
    <div className="custom-event-content text-white" style={colorStyle}>
      <div className="custom-hour">{eventInfo.timeText}</div>
      <div className="custom-title" style={{ fontSize: '10px', fontWeight: 'bold' }}>
        {patientName}
      </div>
    </div>
  );
}, [getEventColor, patients]);

const patientsData = useMemo(
  () =>
    (patients || [])
      .map((p) => ({
        label: p.patientProfile
          ? `${p.patientProfile.firstName} ${p.patientProfile.lastName}`.trim()
          : p.firstName
          ? `${p.firstName} ${p.lastName}`
          : p.email,
        value: p._id,
      }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  [patients]
);

const therapistsData = useMemo(
  () =>
    (therapists || [])
      .map((t) => ({
        label: t.therapistProfile
          ? `${t.therapistProfile.firstName} ${t.therapistProfile.lastName}`.trim()
          : t.firstName
          ? `${t.firstName} ${t.lastName}`
          : t.email,
        value: t._id,
      }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  [therapists]
);

  const servicesData = useMemo(
    () =>
      (services || [])
        .map((s) => ({
          label: s.name,
          value: s._id,
        }))
        .sort((a, b) => a.label.localeCompare(b.label, "es", { sensitivity: "base" })),
    [services]
  );

  // Terapeutas del checklist "Terapeutas en calendario": orden alfabético +
  // filtro por la barra de búsqueda (con debounce). No afecta a `therapists`
  // (usado por los SelectPicker de Paciente/Terapeuta del formulario).
  const visibleCalendarTherapists = useMemo(
    () =>
      [...therapists]
        .sort((a, b) => getFullName(a).localeCompare(getFullName(b), "es", { sensitivity: "base" }))
        .filter((therapist) =>
          getFullName(therapist)
            .toLowerCase()
            .includes(debouncedTherapistFilterSearch.trim().toLowerCase())
        ),
    [therapists, debouncedTherapistFilterSearch, getFullName]
  );

  // NUEVO: filtrar SOLO las citas que pertenecen a los terapeutas seleccionados.
  // La colección original de appointments no se modifica.
  const filteredAppointments = useMemo(
    () =>
      (appointments || [])
        .filter((appointment) => {
          const therapistId =
            typeof appointment.therapist === "object" && appointment.therapist !== null
              ? appointment.therapist._id
              : appointment.therapist;

          return selectedCalendarTherapists.includes(therapistId?.toString());
        })
        // El calendario se renderiza con timeZone="UTC" para que todos los
        // usuarios vean la misma hora sin importar su propia zona horaria; aquí
        // se "disfrazan" los instantes reales como su hora de pared en la
        // clínica para que FullCalendar los dibuje correctamente. El estado
        // `appointments` original (instantes reales) no se toca.
        .map((appointment) => ({
          ...appointment,
          start: toFullCalendarDate(appointment.start, CLINIC_TIMEZONE),
          end: toFullCalendarDate(appointment.end, CLINIC_TIMEZONE),
        })),
    [appointments, selectedCalendarTherapists]
  );

  const toggleCalendarTherapist = useCallback((therapistId) => {
    const id = therapistId.toString();

    setSelectedCalendarTherapists((current) =>
      current.includes(id)
        ? current.filter((selectedId) => selectedId !== id)
        : [...current, id]
    );
  }, []);

  const selectAllCalendarTherapists = useCallback(() => {
    setSelectedCalendarTherapists(
      therapists.map((therapist) => therapist._id.toString())
    );
  }, [therapists]);

  const clearCalendarTherapists = useCallback(() => {
    setSelectedCalendarTherapists([]);
  }, []);

  // Al colapsar/expandir el sidebar, el <aside> cambia de ancho con una
  // transición CSS de 300ms; FullCalendar solo recalcula el tamaño de su
  // grilla ante un evento 'resize' de window (handleWindowResize, activo
  // por defecto), así que aquí se dispara uno sintético para que la
  // columna deje de quedarse a la mitad con espacio en blanco a la
  // derecha. Se dispara una vez al cambiar el estado y otra vez al
  // terminar la transición, para capturar el ancho final del contenedor.
  useEffect(() => {
    window.dispatchEvent(new Event("resize"));
    const timeoutId = setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 320);
    return () => clearTimeout(timeoutId);
  }, [isSidebarCollapsed]);

  // Config estática de FullCalendar: antes se pasaban como objetos/arrays
  // literales inline, es decir, una referencia NUEVA en cada render de
  // Citas. @fullcalendar/react vuelve a aplicar opciones cuando cambian
  // por referencia, lo que además de trabajo de más, alimentaba el ciclo
  // de re-render junto con datesSet. Memoizados, solo cambian cuando de
  // verdad deben cambiar.
  const calendarSlotLabelFormat = useMemo(
    () => ({ hour: "numeric", minute: "2-digit", meridiem: "short", hour12: false }),
    []
  );
  const calendarHeaderToolbar = useMemo(
    () => ({ left: "prev,next today,horario", center: "title", right: "timeGridWeek,timeGridDay" }),
    []
  );
  const calendarButtonText = useMemo(
    () => ({ today: "Hoy", week: "Semana", day: "Día", horario: "Horario" }),
    []
  );
  const calendarCustomButtons = useMemo(
    () => ({
      horario: {
        text: "Horario",
        click: () => setIsScheduleModalOpen(true),
      },
    }),
    []
  );
  const calendarHiddenDays = useMemo(() => [0], []);


  return (
  <div className="h-screen overflow-hidden bg-slate-50 flex flex-col">
    <div className="max-w-7xl w-full mx-auto flex gap-4 py-6 px-4 flex-1 min-h-0">

      {/* Sidebar izquierda: colapsable. Al colapsar se reduce a una barra
          delgada (solo el botón de toggle) y `main`, al ser flex-1, ocupa
          automáticamente el ancho que libera. */}
      <aside
        className={`relative flex-shrink-0 h-full overflow-y-auto flex flex-col gap-4 transition-all duration-300 ${
          isSidebarCollapsed ? "w-12" : "w-80"
        }`}
      >
        <div className={`flex ${isSidebarCollapsed ? "justify-center" : "justify-end"}`}>
          <button
            type="button"
            onClick={() => setIsSidebarCollapsed((prev) => !prev)}
            title={isSidebarCollapsed ? "Expandir panel" : "Colapsar panel"}
            className="bg-white border border-slate-200 rounded-lg shadow-sm h-8 w-8 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition"
          >
            {isSidebarCollapsed ? "»" : "«"}
          </button>
        </div>

        {!isSidebarCollapsed && (
        <>
        {/* Tarjeta superior: info rápida */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
          <h2 className="text-sm font-semibold text-slate-800 mb-2">
            Visión general
          </h2>
          <p className="text-xs text-slate-500">
            Haz clic en un hueco del calendario para crear una nueva cita, o selecciona una existente para ver detalles.
          </p>
        </div>

        {/* NUEVO: filtro de terapeutas del calendario */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-800">
              Terapeutas en calendario
            </h2>
            <span className="text-[10px] font-semibold text-slate-500">
              {selectedCalendarTherapists.length}/{therapists.length}
            </span>
          </div>

          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={selectAllCalendarTherapists}
              className="flex-1 text-[11px] font-semibold bg-sky-50 text-sky-600 hover:bg-sky-100 py-2 rounded-lg"
            >
              Todos
            </button>
            <button
              type="button"
              onClick={clearCalendarTherapists}
              className="flex-1 text-[11px] font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 py-2 rounded-lg"
            >
              Ninguno
            </button>
          </div>

          {/* Aviso: con muchos terapeutas a la vez la vista Semana se
              satura visualmente (varias citas simultáneas por celda). */}
          {selectedCalendarTherapists.length > 4 && (
            <div className="mb-3 flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
              <span className="text-amber-500 text-xs leading-none mt-0.5">⚠️</span>
              <p className="text-[11px] text-amber-700 leading-snug">
                Tienes {selectedCalendarTherapists.length} terapeutas a la vista. Para mayor claridad, prueba la vista{" "}
                <strong>"Día"</strong> del calendario (arriba a la derecha).
              </p>
            </div>
          )}

          <div className="relative mb-3">
            <input
              type="text"
              value={therapistFilterSearch}
              onChange={(e) => setTherapistFilterSearch(e.target.value)}
              placeholder="Buscar terapeuta..."
              className="w-full text-xs p-2 pl-8 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none text-slate-700"
            />
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
              🔍
            </span>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
            {visibleCalendarTherapists.map((therapist) => {
              const therapistId = therapist._id.toString();
              const isSelected = selectedCalendarTherapists.includes(therapistId);

              return (
                <label
                  key={therapistId}
                  className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition ${
                    isSelected ? "bg-sky-50" : "hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleCalendarTherapist(therapistId)}
                    className="h-4 w-4 accent-sky-500"
                  />
                  <span className="text-xs text-slate-700">
                    {getFullName(therapist)}
                  </span>
                </label>
              );
            })}
            {visibleCalendarTherapists.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-3">
                Sin resultados
              </p>
            )}
          </div>
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

              {/* --- Cita recurrente --- */}
              <div className="border-t pt-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="h-4 w-4 accent-sky-500"
                  />
                  <span className="font-medium text-slate-700">
                    ¿Es una cita recurrente?
                  </span>
                </label>

                {isRecurring && (
                  <div className="mt-3 space-y-3 bg-sky-50 border border-sky-100 rounded-lg p-3">
                    <div>
                      <label className="block mb-1 font-medium text-slate-700">
                        Frecuencia
                      </label>
                      <select
                        value={recurrenceFrequency}
                        onChange={(e) => setRecurrenceFrequency(e.target.value)}
                        className="block w-full p-2 border rounded-md text-xs bg-white"
                      >
                        <option value="weekly">Semanal</option>
                      </select>
                    </div>

                    <div>
                      <label className="block mb-1 font-medium text-slate-700">
                        Número de semanas
                      </label>
                      <input
                        type="number"
                        min={2}
                        max={52}
                        value={recurrenceWeeks}
                        onChange={(e) => setRecurrenceWeeks(e.target.value)}
                        className="block w-full p-2 border rounded-md text-xs bg-white"
                      />
                      <p className="text-[11px] text-slate-500 mt-1">
                        Se crearán {Math.max(1, Number(recurrenceWeeks) || 1)} citas, una cada semana a partir de la fecha seleccionada.
                      </p>
                    </div>
                  </div>
                )}
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
        </>
        )}
      </aside>

      {/* Columna principal: calendario */}
      <main className="flex-1 min-w-0 h-full overflow-auto">
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

          <div className="calendar-container w-full min-w-0 flex-1">
            <FullCalendarView
              key={calKey}
              initialView="timeGridWeek"
              datesSet={handleDatesSet}
              // Fijo a "UTC": junto con el "disfraz" aplicado en
              // filteredAppointments, hace que TODOS los usuarios vean la
              // misma hora de la clínica, sin importar la zona horaria de
              // su propio navegador (antes usaba la zona local por
              // defecto, lo que ocultaba citas fuera de slotMinTime/Max
              // para usuarios en zonas muy distintas, p. ej. Filipinas).
              timeZone="UTC"
              events={filteredAppointments}
              editable={true}
              selectable={true}
              eventDrop={handleEventDrop}
              dateClick={handleDateClick}
              eventClick={handleEventClick}
              hiddenDays={calendarHiddenDays}
              eventContent={renderEventContent}
              slotLabelFormat={calendarSlotLabelFormat}
              slotMinTime={workSchedule.startTime}
              slotMaxTime={workSchedule.endTime}
              headerToolbar={calendarHeaderToolbar}
              locale="es"
              height="auto"
              //slotMinHeight={50}
              buttonText={calendarButtonText}
              customButtons={calendarCustomButtons}
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
    const p = selectedAppointment?.patient;
    if (!p) return "Sin annbvsignar";

    // Intentamos obtener el perfil (ya sea del nuevo modelo o del antiguo)
    const profile = p.patientProfile || p;

    // Verificamos si existe el nombre en el perfil
    if (profile && profile.firstName) {
      return `${profile.firstName} ${profile.lastName || ""}`.trim();
    }

    // Si solo es un ID o no tiene nombre, buscamos en la lista cargada de pacientes
    const targetId = typeof p === "object" ? p._id : p;
    const found = patients.find((x) => x._id === targetId);
    if (found) {
      const fProfile = found.patientProfile || found;
      return `${fProfile.firstName || ""} ${fProfile.lastName || ""}`.trim();
    }

    return "No encontrado";
  })()}
</p>


          <p>
            <strong>Terapeuta:</strong>{" "}
            {(() => {
    // Definimos 't' como el terapeuta de la cita
    const t = selectedAppointment?.therapist; 
    if (!t) return "Sin asignar";

    // 1. Intentamos obtener el perfil (si t es un objeto)
    const profile = t.therapistProfile || (typeof t === "object" ? t : null);
    if (profile?.firstName) {
      return `${profile.firstName} ${profile.lastName || ""}`.trim();
    }

    // 2. Si falló lo anterior, buscamos por ID en la lista global 'therapists'
    // AQUÍ ESTABA EL ERROR: Usábamos 'p' en lugar de 't'
    const targetId = typeof t === "object" ? t._id : t;
    const found = therapists.find((x) => x && x._id === targetId);
    
    if (found) {
      const fProfile = found.therapistProfile || found;
      return `${fProfile.firstName || ""} ${fProfile.lastName || ""}`.trim();
    }

    return "No encontrado";
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

          <BotonDeleteCitas
            id={selectedAppointment.idd}
            recurrenceGroupId={selectedAppointment.recurrenceGroupId}
            onDeleted={() => {
              closeModal();
              refetchAppointments();
              setCalKey((k) => k + 1);
            }}
          />
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
    typeof selectedAppointment.patient === "object" && selectedAppointment.patient !== null
      ? selectedAppointment.patient._id
      : selectedAppointment.patient
  }
  selectedTherapist={
    typeof selectedAppointment.therapist === "object" && selectedAppointment.therapist !== null
      ? selectedAppointment.therapist._id
      : selectedAppointment.therapist
  }
            selectedService={selectedAppointment.serviceId}
            appointmentDate={formatZonedDate(selectedAppointment.start, CLINIC_TIMEZONE)}
            appointmentStartTime={formatZonedTime(selectedAppointment.start, CLINIC_TIMEZONE)}
            appointmentEndTime={formatZonedTime(selectedAppointment.end, CLINIC_TIMEZONE)}
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