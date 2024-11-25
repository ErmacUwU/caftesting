"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";

const ActualizarCita = ({
  id,
  selectedPatient,
  selectedTherapist,
  selectedService,
  appointmentDate,
  appointmentStartTime,
  appointmentEndTime,
  cost,
  onClose,
}) => {
  const [newPatient, setNewPatient] = useState("");
  const [newTherapist, setNewTherapist] = useState(selectedTherapist);
  const [newService, setNewService] = useState(selectedService);
  const [newAppointmentDate, setNewAppointmentDate] = useState(appointmentDate);
  const [newStartTime, setNewStartTime] = useState(appointmentStartTime);
  const [newEndTime, setNewEndTime] = useState(appointmentEndTime);
  const [newCost, setNewCost] = useState(cost);
  const [patients, setPatients] = useState([]);
  const [therapists, setTherapists] = useState([]);
  const [services] = useState([
    { id: 1, name: "Consulta General", duration: 30, cost: 500 },
    { id: 2, name: "Terapia Física", duration: 60, cost: 1000 },
    { id: 3, name: "Consulta Especializada", duration: 45, cost: 800 },
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [patientsRes, therapistsRes] = await Promise.all([
          axios.get("/api/patient"),
          axios.get("/api/therapist"),
        ]);
        setPatients(patientsRes.data.patient || []);
        setTherapists(therapistsRes.data.therapist || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedTherapist && selectedService) {
      console.log(selectedService);
      console.log(selectedTherapist);
      setNewTherapist(selectedTherapist);  // Esto debería asignar el terapeuta seleccionado
      setNewService(selectedService);  // Esto debería asignar el servicio seleccionado
    }
  }, [selectedTherapist, selectedService]);
  

  const calculateEndTime = (startTime, duration) => {
    const [hours, minutes] = startTime.split(":").map(Number);
    const endTime = new Date();
    endTime.setHours(hours);
    endTime.setMinutes(minutes + duration);
    return endTime.toTimeString().slice(0, 5);
  };

  const handleServiceChange = (e) => {
    const selectedServiceId = e.target.value;
    setNewService(selectedServiceId);

    const selectedService = services.find(
      (service) => service.id.toString() === selectedServiceId
    );
    if (newStartTime && selectedService) {
      setNewEndTime(calculateEndTime(newStartTime, selectedService.duration));
      setNewCost(selectedService.cost);
    }
  };

  const updateAppointment = async (e) => {
    e.preventDefault();
  
    // Asegúrate de que la hora esté correctamente combinada con la fecha
    const startDateTime = new Date(`${newAppointmentDate}T${newStartTime}:00`);
    const endDateTime = new Date(`${newAppointmentDate}T${newEndTime}:00`);
  
    const therapist = therapists.find((t) => t._id === newTherapist);
    const therapistName = therapist ? `${therapist.firstName} ${therapist.lastName}` : "Terapeuta no encontrado";
  
    const patient = patients.find((p) => p._id === newPatient);
    const patientName = patient ? `${patient.firstName} ${patient.lastName}` : "Paciente no encontrado";
  
    const service = services.find((s) => s.id.toString() === newService);
  
    const appointmentData = {
      newIdDate: id, // El id que se pasa para actualizar
      newDate: newAppointmentDate, // La fecha de la cita
      newStart: startDateTime.toISOString(), // Formatea la hora de inicio correctamente
      newEnd: endDateTime.toISOString(), // Formatea la hora de fin correctamente
      newTherapist: therapistName,
      newPatient: patientName,
      newTitle: service?.name || "",
      newDescription: service?.name || "",
      newCost: parseFloat(newCost),
    };
  
    console.log("Datos enviados para actualización:", appointmentData); // Verifica que los datos sean correctos
  
    try {
      const res = await axios.put(`/api/date/${id}`, appointmentData);
      if (res.status === 200) {
        alert("Cita actualizada exitosamente");
        onClose(); // Cierra el formulario después de actualizar
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
          <option value="">Seleccione un terapeuta</option>
          {therapists.map((therapist) => (
            <option key={therapist._id} value={therapist._id}>
              {therapist.firstName} {therapist.lastName}
            </option>
          ))}
        </select>
      </div>

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
          <option value="">Seleccione un servicio</option>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name}
            </option>
          ))}
        </select>
      </div>

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

      <div className="mb-4">
        <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
          Hora de Inicio<span className="text-red-600">*</span>
        </label>
        <input
          type="time"
          id="startTime"
          value={newStartTime}
          onChange={(e) => {
            setNewStartTime(e.target.value);
            const selectedService = services.find((s) => s.id.toString() === newService);
            if (selectedService) {
              setNewEndTime(calculateEndTime(e.target.value, selectedService.duration));
            }
          }}
          className="w-full p-2 mt-1 border border-gray-300 rounded"
          required
        />
      </div>

      <div className="mb-4">
        <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
          Hora de Fin
        </label>
        <input
          type="time"
          id="endTime"
          value={newEndTime}
          onChange={(e) => setNewEndTime(e.target.value)}
          className="w-full p-2 mt-1 border border-gray-300 rounded"
        />
      </div>

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
