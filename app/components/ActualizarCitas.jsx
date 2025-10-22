"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { TimePicker } from "rsuite";
import "rsuite/dist/rsuite-no-reset.min.css";

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

  // 🔹 Cargar y ordenar servicios alfabéticamente
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await axios.get("/api/service");
        const sorted = [...(res.data.services || [])].sort((a, b) =>
          a.name.localeCompare(b.name, "es", { sensitivity: "base" })
        );
        setServices(sorted);
      } catch (error) {
        console.error("Error al cargar los servicios", error);
      }
    };
    fetchServices();
  }, []);

  // 🔹 Cargar pacientes y terapeutas ordenados alfabéticamente
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [patientsRes, therapistsRes] = await Promise.all([
          axios.get("/api/patient"),
          axios.get("/api/therapist"),
        ]);

        const sortedPatients = [...(patientsRes.data.patient || [])].sort((a, b) =>
          `${a.firstName} ${a.lastName}`.localeCompare(
            `${b.firstName} ${b.lastName}`,
            "es",
            { sensitivity: "base" }
          )
        );

        const sortedTherapists = [...(therapistsRes.data.therapist || [])].sort((a, b) =>
          `${a.firstName} ${a.lastName}`.localeCompare(
            `${b.firstName} ${b.lastName}`,
            "es",
            { sensitivity: "base" }
          )
        );

        setPatients(sortedPatients);
        setTherapists(sortedTherapists);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedTherapist && selectedService) {
      setNewPatient(selectedPatient);
      setNewTherapist(selectedTherapist);
      setNewService(selectedService?.toString?.() || "");
      setNewDuration(appointmentDuration);
    }
  }, [selectedPatient, selectedTherapist, selectedService, appointmentDuration]);

  const calculateEndTime = (startTime, duration) => {
    if (!startTime) return "";
    const [hours, minutes] = startTime.split(":").map(Number);
    const end = new Date();
    end.setHours(hours);
    end.setMinutes((minutes || 0) + (duration || 0));
    return end.toTimeString().slice(0, 5);
  };

  const handleServiceChange = (e) => {
    const selectedServiceId = e.target.value;
    setNewService(selectedServiceId);
    const svc = services.find((s) => s._id.toString() === selectedServiceId);
    if (newStartTime && svc) {
      setNewEndTime(calculateEndTime(newStartTime, svc.duration));
      setNewDuration(svc.duration);
      setNewCost(svc.cost);
    }
  };

  const handleDurationChange = (e) => {
    let dur = parseInt(e.target.value, 10);
    if (dur > 120) dur = 120;
    if (dur < 0) dur = 0;
    setNewDuration(dur);
    if (newStartTime) {
      setNewEndTime(calculateEndTime(newStartTime, dur));
    }
  };

  const updateAppointment = async (e) => {
    e.preventDefault();

    const startDateTime = new Date(`${newAppointmentDate}T${newStartTime}:00`);
    const endDateTime = new Date(`${newAppointmentDate}T${newEndTime}:00`);

    const therapist = therapists.find((t) => t._id === newTherapist);
    const patient = patients.find((p) => p._id === newPatient);
    const svc = services.find(
      (s) =>
        s._id?.toString() === newService?.toString() ||
        s.name === selectedService
    );

    const appointmentData = {
      newDate: newAppointmentDate,
      newStart: startDateTime.toISOString(),
      newEnd: endDateTime.toISOString(),
      newDuration,
      newTherapist: therapist,
      newPatient: patient,
      newTitle: svc?.name || "",
      newDescription: svc?.name || "",
      newCost: parseFloat(newCost),
      newColor: svc?.color || "#bdc3c7",
      serviceId: svc?._id,
    };

    try {
      const res = await axios.put(`/api/date/${id}`, appointmentData);
      if (res.status === 200) {
        onUpdate && onUpdate();
        onClose();
      } else {
        alert("Error en la actualización");
      }
    } catch (error) {
      console.error("Error al actualizar la cita:", error);
      alert("Error al actualizar la cita");
    }
  };

  return (
    <form className="max-w-md mx-auto p-4 bg-gray-100">
      <h1 className="text-black font-extrabold">ACTUALIZACIÓN DE CITA</h1>

      {/* 🔹 Pacientes */}
      <div className="mb-4">
        <label htmlFor="patient" className="block text-sm font-medium text-gray-700">
          Paciente<span className="text-red-600">*</span>
        </label>
        <select
          id="patient"
          value={newPatient}
          onChange={(e) => setNewPatient(e.target.value)}
          className="block w-full p-2 mt-1 border border-gray-300 rounded"
          required
        >
          {patients.map((p) => (
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
        <select
          id="therapist"
          value={newTherapist}
          onChange={(e) => setNewTherapist(e.target.value)}
          className="block w-full p-2 mt-1 border border-gray-300 rounded"
          required
        >
          {therapists.map((t) => (
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
            <option key={s._id} value={s._id}>
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
