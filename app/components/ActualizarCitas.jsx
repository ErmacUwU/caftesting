"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { TimePicker } from "rsuite";
import "rsuite/dist/rsuite-no-reset.min.css"; // Estilos sin reset global

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
  onUpdate
}) => {
  const [newPatient, setNewPatient] = useState(selectedPatient);
  const [newTherapist, setNewTherapist] = useState(selectedTherapist);
  const [newService, setNewService] = useState(selectedService);
  const [newAppointmentDate, setNewAppointmentDate] = useState(appointmentDate);
  const [newStartTime, setNewStartTime] = useState(appointmentStartTime);
  const [newDuration,setNewDuration] = useState(appointmentDuration);
  const [newEndTime, setNewEndTime] = useState(appointmentEndTime);
  const [newCost, setNewCost] = useState(cost || 0 );
  const [patients, setPatients] = useState([]);
  const [therapists, setTherapists] = useState([]);

  const [services, setServices] = useState([])

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await axios.get("/api/service")
        setServices(res.data.services || [])
      } catch (error) {
        console.error("Error al cargar los servicios", error)
      }
    }

    fetchServices()
  }, [])


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
      setNewPatient(selectedPatient);
      setNewTherapist(selectedTherapist);
      setNewService(selectedService?.toString() || "");
      setNewAppointmentDate(appointmentDate);
      setNewDuration(appointmentDuration);
    }
  }, [selectedPatient, selectedTherapist, selectedService, appointmentDuration, appointmentDate]);
  

  const calculateEndTime = (startTime, duration) => {
    const [hours, minutes] = startTime.split(":").map(Number);
    const startDate = new Date(1970, 0, 1, hours, minutes);
    const endDate = new Date(startDate.getTime() + duration * 60000);
    return endDate.toTimeString().slice(0, 5);
  };


  const handleServiceChange = (e) => {
    const selectedServiceId = e.target.value;
    setNewService(selectedServiceId);

    const selectedService = services.find(
      (service) => service._id.toString() === selectedServiceId
    );
    if (newStartTime && selectedService) {
      setNewEndTime(calculateEndTime(newStartTime, selectedService.duration));
      setNewDuration(selectedService.duration); // Asignar duración predefinida
      setNewCost(selectedService.cost);
    }
  };

   // Actualizar duración y hora de fin automáticamente
   const handleDurationChange = (e) => {
    let newDuration = parseInt(e.target.value, 10);
    if (newDuration > 120) newDuration = 120; // Máximo 2 horas
    if (newDuration < 0) newDuration = 0; // No puede ser negativa

    setNewDuration(newDuration);
    if (appointmentStartTime) {
      setNewEndTime(calculateEndTime(newStartTime, newDuration));
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
  
    const service = services.find((s) => {
      return  (
        s._id?.toString() === newService?.toString() ||
        s.name === selectedService
        );
      });
  
    const appointmentData = {
      newDate: newAppointmentDate, // La fecha de la cita
      newStart: startDateTime.toISOString(), // Formatea la hora de inicio correctamente
      newEnd: endDateTime.toISOString(), // Formatea la hora de fin correctamente
      newDuration: newDuration,
      newTherapist: therapist,
      newPatient: patient,
      newTitle: service?.name || "",
      newDescription: service?.name || "",
      newCost: parseFloat(newCost),
      newColor: service?.color || "#bdc3c7",
      serviceId: service?._id,
    };
  
    console.log("Datos enviados para actualización:", appointmentData); // Verifica que los datos sean correctos
  
    try {
      const res = await axios.put(`/api/date/${id}`, appointmentData);
      if (res.status === 200) {
        if (onUpdate) onUpdate()
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
          {patients.map((patient) => (
            <option key={patient._id} value={patient._id}>
              {patient.firstName} {patient.lastName}
            </option>
          ))}
        </select>
      </div>

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
          {therapists.map((therapist) => (
            <option key={therapist._id} value={therapist._id}>
              {therapist.firstName} {therapist.lastName}
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
        <TimePicker
          format="HH:mm"
          value={newStartTime ? new Date(`1970-01-01T${newStartTime}:00`) : null}
          onChange={(newValue) => {
            if (newValue) {
              const formattedTime = newValue.toTimeString().slice(0, 5); // Formatea como HH:mm
              setNewStartTime(formattedTime);

              // Calcular la nueva hora de finalización si hay un servicio seleccionado
              const selectedService = services.find((s) => s._id.toString() === newService);
              if (selectedService) {
                setNewEndTime(calculateEndTime(formattedTime, selectedService.duration));
              }
            }
          }}
          hideMinutes={(minute) => minute % 5 !== 0} // 🔹 Minutos en pasos de 5
          cleanable={false} // 🔹 No permite limpiar
          placement="topStart"
          className="w-full p-2 mt-1 border border-gray-300 rounded"
        />
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
          <option value="">-- Selecciona un servicio --</option>
          {services.map((service) => (
            <option key={service._id} value={service._id}>
              {service.name}
            </option>
          ))}
        </select>
      </div>

      <label className="block mb-2">Duración de la Cita (minutos):</label>
            <select
              value={newDuration}
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

      <div className="mb-4">
        <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
          Hora de Fin
        </label>
        <TimePicker
          format="HH:mm"
          value={newEndTime ? new Date(`1970-01-01T${newEndTime}:00`) : null}
          onChange={(newValue) => {
            if (newValue) {
              const formattedTime = newValue.toTimeString().slice(0, 5); // Formatea como HH:mm
              setNewEndTime(formattedTime);
            }
          }}
          hideMinutes={(minute) => minute % 5 !== 0} // 🔹 Minutos en pasos de 5
          cleanable={false} // 🔹 No permite limpiar
          placement="topStart"
          className="w-full p-2 mt-1 border border-gray-300 rounded"
          disabled
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
