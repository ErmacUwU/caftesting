"use client";
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import axios from "axios";
import { TimePicker } from "rsuite";
import "rsuite/dist/rsuite-no-reset.min.css";
import { CLINIC_TIMEZONE, zonedTimeToUtc } from "@/lib/clinicTime";
import useDebounce from "@/hooks/useDebounce";

const ActualizarCita = ({
  id,
  selectedPatient,
  selectedTherapist,
  selectedService,
  appointmentDate,
  appointmentStartTime,
  appointmentEndTime,
  appointmentDuration,
  cost,
  onClose,
  onUpdate,
  // Opcionales: si quien nos monta (p. ej. app/citas/page.jsx) ya tiene
  // pacientes/terapeutas/servicios cargados, los reutilizamos en vez de
  // volver a pedirlos a la API. Si no se pasan, este componente sigue
  // cargándolos por su cuenta como antes (caso de TarjetaCitas.jsx).
  preloadedPatients,
  preloadedTherapists,
  preloadedServices,
}) => {
  const [newPatient, setNewPatient] = useState(selectedPatient);
  const [newTherapist, setNewTherapist] = useState(selectedTherapist);
  const [newService, setNewService] = useState(
    selectedService?.toString?.() || selectedService || ""
  );
  const [newAppointmentDate, setNewAppointmentDate] = useState(appointmentDate);
  const [newStartTime, setNewStartTime] = useState(appointmentStartTime);
  const [newDuration, setNewDuration] = useState(appointmentDuration);
  const [newEndTime, setNewEndTime] = useState(appointmentEndTime);
  const [newCost, setNewCost] = useState(cost);
  const [patients, setPatients] = useState([]);
  const [therapists, setTherapists] = useState([]);
  const [services, setServices] = useState([]);
  const [patientSearch, setPatientSearch] = useState("");
  const [therapistSearch, setTherapistSearch] = useState("");
  const debouncedPatientSearch = useDebounce(patientSearch, 300);
  const debouncedTherapistSearch = useDebounce(therapistSearch, 300);

  // 🔹 Cargar y ordenar servicios alfabéticamente (o reutilizar los del padre)
  useEffect(() => {
    const sortServices = (list) =>
      [...(list || [])].sort((a, b) =>
        a.name.localeCompare(b.name, "es", { sensitivity: "base" })
      );

    if (preloadedServices) {
      setServices(sortServices(preloadedServices));
      return;
    }

    const fetchServices = async () => {
      try {
        const res = await axios.get("/api/service");
        setServices(sortServices(res.data.services));
      } catch (error) {
        console.error("Error al cargar los servicios", error);
      }
    };
    fetchServices();
  }, [preloadedServices]);

 // 1. Añade esto en la parte superior de tu componente
const isInitialLoad = useRef(true);

// 2. Modifica el useEffect así
useEffect(() => {
  // Solo ejecutamos esto si estamos en la carga inicial y los datos están listos
  if (isInitialLoad.current && services.length > 0 && selectedService) {
    setNewService(selectedService.toString());
    
    const svc = services.find((s) => s._id.toString() === selectedService.toString());
    
   
    
    // Marcamos que la carga inicial ya ocurrió
    isInitialLoad.current = false;
  }
}, [services, selectedService]);



  // 🔹 Cargar pacientes y terapeutas ordenados alfabéticamente (o reutilizar
  // los del padre, p. ej. app/citas/page.jsx, que ya los tiene cargados).
  useEffect(() => {
    // Ajuste para el modelo UsuarioTrue + populate: el perfil está en
    // .patientProfile/.therapistProfile, aquí lo aplanamos para que el
    // sort y el <select> funcionen igual sin importar de dónde vino la lista.
    const formatAndSort = (data) => {
      return [...(data || [])]
        .map(u => ({
          ...u,
          firstName: u.patientProfile?.firstName || u.therapistProfile?.firstName || "",
          lastName: u.patientProfile?.lastName || u.therapistProfile?.lastName || "",
          _id: u._id
        }))
        .sort((a, b) =>
          `${a.firstName} ${a.lastName}`.localeCompare(
            `${b.firstName} ${b.lastName}`,
            "es",
            { sensitivity: "base" }
          )
        );
    };

    if (preloadedPatients && preloadedTherapists) {
      setPatients(formatAndSort(preloadedPatients));
      setTherapists(formatAndSort(preloadedTherapists));
      return;
    }

    const fetchData = async () => {
      try {
        const [patientsRes, therapistsRes] = await Promise.all([
          axios.get("/api/usuarioTrue?role=patient"),
          axios.get("/api/usuarioTrue?role=therapist"),
        ]);
        setPatients(formatAndSort(patientsRes.data));
        setTherapists(formatAndSort(therapistsRes.data));
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, [preloadedPatients, preloadedTherapists]);

  useEffect(() => {
    if (selectedTherapist && selectedService) {
      setNewPatient(selectedPatient);
      setNewTherapist(selectedTherapist);
      setNewService(selectedService?.toString?.() || "");
      setNewDuration(appointmentDuration);
    }
  }, [selectedPatient, selectedTherapist, selectedService, appointmentDuration]);

  const calculateEndTime = useCallback((startTime, duration) => {
    if (!startTime) return "";
    const [hours, minutes] = startTime.split(":").map(Number);
    const end = new Date();
    end.setHours(hours);
    end.setMinutes((minutes || 0) + (duration || 0));
    return end.toTimeString().slice(0, 5);
  }, []);



  const handleServiceChange = useCallback((e) => {
    const selectedServiceId = e.target.value;
    setNewService(selectedServiceId);
    const svc = services.find((s) => s._id.toString() === selectedServiceId);
    if (newStartTime && svc) {
      setNewEndTime(calculateEndTime(newStartTime, svc.duration));
      setNewDuration(svc.duration);
      setNewCost(svc.cost);
    }
  }, [services, newStartTime, calculateEndTime]);

  const handleDurationChange = useCallback((e) => {
    let dur = parseInt(e.target.value, 10);
    if (dur > 120) dur = 120;
    if (dur < 0) dur = 0;
    setNewDuration(dur);
    if (newStartTime) {
      setNewEndTime(calculateEndTime(newStartTime, dur));
    }
  }, [newStartTime, calculateEndTime]);

  const updateAppointment = useCallback(async (e) => {
  e.preventDefault();

  // La fecha/hora tecleada representa siempre la hora de la clínica
  // (America/Tijuana), no la zona horaria local del navegador de quien
  // edita la cita — así todos los usuarios guardan/ven el mismo instante.
  const startDateTime = zonedTimeToUtc(newAppointmentDate, newStartTime, CLINIC_TIMEZONE);
  const endDateTime = zonedTimeToUtc(newAppointmentDate, newEndTime, CLINIC_TIMEZONE);

  // Buscamos el servicio para obtener el título
  const svc = services.find(
    (s) => s._id?.toString() === newService?.toString() || s.name === selectedService
  );

  // CONSTRUCCIÓN DEL OBJETO CORREGIDO
  // Asegúrate de que esto esté dentro de tu función updateAppointment
const appointmentData = {
  date: newAppointmentDate, // Debe ser "2026-05-01"
  start: startDateTime.toISOString(), // Formato completo
  end: endDateTime.toISOString(),
  duration: Number(newDuration),
  therapist: newTherapist, // Debe ser el ID (string)
  patient: newPatient,     // Debe ser el ID (string)
  title: svc?.name || "",
  cost: parseFloat(newCost),
  serviceId: newService,   // ID del servicio
};

  try {
    const res = await axios.put(`/api/date/${id}`, appointmentData);
    
    if (res.status === 200) {
      onUpdate && onUpdate();
      onClose();
    }
  } catch (error) {
    console.error("Error al actualizar la cita:", error);
    alert("Error al actualizar la cita. Revisa la consola.");
  }
  }, [
    newAppointmentDate,
    newStartTime,
    newEndTime,
    services,
    newService,
    selectedService,
    newDuration,
    newTherapist,
    newPatient,
    newCost,
    id,
    onUpdate,
    onClose,
  ]);

  // Listas ya vienen ordenadas alfabéticamente (ver formatAndSort); aquí
  // solo se filtran por la barra de búsqueda (con debounce) de cada
  // selector. El actualmente seleccionado siempre se mantiene visible,
  // aunque no coincida con la búsqueda, para no perder la selección del
  // <select>.
  const visiblePatients = useMemo(
    () =>
      patients.filter(
        (p) =>
          p._id === newPatient ||
          `${p.firstName} ${p.lastName}`
            .toLowerCase()
            .includes(debouncedPatientSearch.trim().toLowerCase())
      ),
    [patients, newPatient, debouncedPatientSearch]
  );
  const visibleTherapists = useMemo(
    () =>
      therapists.filter(
        (t) =>
          t._id === newTherapist ||
          `${t.firstName} ${t.lastName}`
            .toLowerCase()
            .includes(debouncedTherapistSearch.trim().toLowerCase())
      ),
    [therapists, newTherapist, debouncedTherapistSearch]
  );

  return (
    <form className="max-w-md mx-auto p-4 bg-gray-100">
      <h1 className="text-black font-extrabold">ACTUALIZACIÓN DE CITA</h1>

      {/* 🔹 Pacientes */}
      <div className="mb-4">
        <label htmlFor="patient" className="block text-sm font-medium text-gray-700">
          Paciente<span className="text-red-600">*</span>
        </label>
        <div className="relative mt-1">
          <input
            type="text"
            value={patientSearch}
            onChange={(e) => setPatientSearch(e.target.value)}
            placeholder="Buscar paciente..."
            className="block w-full p-2 pl-8 border border-gray-300 rounded text-sm"
          />
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
            🔍
          </span>
        </div>
        <select
          id="patient"
          value={newPatient}
          onChange={(e) => setNewPatient(e.target.value)}
          className="block w-full p-2 mt-1 border border-gray-300 rounded"
          required
        >
          {visiblePatients.map((p) => (
            <option key={p._id} value={p._id}>
              {p.firstName} {p.lastName}
            </option>
          ))}
        </select>
      </div>

      {/* 🔹 Terapeutas */}
      <div className="mb-4">
        <label htmlFor="therapist" className="block text-sm font-medium text-gray-700">
          Terapeuta<span className="text-red-600">*</span>
        </label>
        <div className="relative mt-1">
          <input
            type="text"
            value={therapistSearch}
            onChange={(e) => setTherapistSearch(e.target.value)}
            placeholder="Buscar terapeuta..."
            className="block w-full p-2 pl-8 border border-gray-300 rounded text-sm"
          />
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
            🔍
          </span>
        </div>
        <select
          id="therapist"
          value={newTherapist}
          onChange={(e) => setNewTherapist(e.target.value)}
          className="block w-full p-2 mt-1 border border-gray-300 rounded"
          required
        >
          {visibleTherapists.map((t) => (
            <option key={t._id} value={t._id}>
              {t.firstName} {t.lastName}
            </option>
          ))}
        </select>
      </div>

      {/* 🔹 Fecha */}
      <div className="mb-4">
        <label htmlFor="appointmentDate" className="block text-sm font-medium text-gray-700">
          Fecha de la Cita<span className="text-red-600">*</span>
        </label>
        <input
          type="date"
          id="appointmentDate"
          value={newAppointmentDate}
          onChange={(e) => setNewAppointmentDate(e.target.value)}
          className="w-full p-2 mt-1 border border-gray-300 rounded"
          required
        />
      </div>

      {/* 🔹 Hora inicio */}
      <div className="mb-4">
        <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
          Hora de Inicio<span className="text-red-600">*</span>
        </label>
        <TimePicker
          format="HH:mm"
          value={newStartTime ? new Date(`1970-01-01T${newStartTime}:00`) : null}
          onChange={(newValue) => {
            if (newValue) {
              const formattedTime = newValue.toTimeString().slice(0, 5);
              setNewStartTime(formattedTime);
              const svc = services.find((s) => s._id.toString() === newService);
              if (svc) setNewEndTime(calculateEndTime(formattedTime, svc.duration));
            }
          }}
          hideMinutes={(m) => m % 5 !== 0}
          cleanable={false}
          placement="topStart"
          className="w-full p-2 mt-1 border border-gray-300 rounded"
        />
      </div>

      {/* 🔹 Servicio */}
      <div className="mb-4">
        <label htmlFor="service" className="block text-sm font-medium text-gray-700">
          Servicio<span className="text-red-600">*</span>
        </label>
        <select
          id="service"
          value={newService}
          onChange={handleServiceChange}
          className="block w-full p-2 mt-1 border border-gray-300 rounded"
          required
        >
          {services.map((s) => (
    // Aseguramos que el value sea el ID como string
    <option key={s._id} value={s._id.toString()}>
      {s.name}
    </option>
  ))}
        </select>
      </div>

      {/* 🔹 Duración */}
      <label className="block mb-2">Duración de la Cita (minutos):</label>
      <select
        value={newDuration}
        onChange={handleDurationChange}
        className="block w-full p-2 border border-gray-300 rounded mt-1"
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

      {/* 🔹 Hora fin */}
      <div className="mb-4">
        <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
          Hora de Fin
        </label>
        <TimePicker
          format="HH:mm"
          value={newEndTime ? new Date(`1970-01-01T${newEndTime}:00`) : null}
          onChange={(newValue) => {
            if (newValue) {
              const formattedTime = newValue.toTimeString().slice(0, 5);
              setNewEndTime(formattedTime);
            }
          }}
          hideMinutes={(m) => m % 5 !== 0}
          cleanable={false}
          placement="topStart"
          className="w-full p-2 mt-1 border border-gray-300 rounded"
          disabled
        />
      </div>

      {/* 🔹 Costo */}
      <div className="mb-4">
        <label htmlFor="cost" className="block text-sm font-medium text-gray-700">
          Costo<span className="text-red-600">*</span>
        </label>
        <input
          type="number"
          id="cost"
          value={newCost}
          onChange={(e) => setNewCost(e.target.value)}
          className="w-full p-2 mt-1 border border-gray-300 rounded"
          required
        />
      </div>

      {/* 🔹 Botones */}
      <div className="mt-4 flex justify-between">
        <button
          type="button"
          onClick={updateAppointment}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
        >
          Actualizar Cita
        </button>
        <button
          type="button"
          onClick={onClose}
          className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
        >
          Regresar
        </button>
      </div>
    </form>
  );
};

export default ActualizarCita;
