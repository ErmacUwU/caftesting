"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.js";
import { useRouter } from "next/navigation";
import { TimePicker } from "rsuite";
import axios from "axios";
import uniquid from "uniquid";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import "./app.css";
import "rsuite/dist/rsuite-no-reset.min.css";

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
  const [services, setServices] = useState([]);
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Formatear fecha en formato "Día Mes"
  const formatDate = (date) => {
    return date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short"
    }).replace(/\./g, '');
  };

  // Obtener nombre del día
  const getDayName = (date, offset) => {
    const days = ["Hoy", "Mañana", "Mié", "Jue", "Vie", "Sáb", "Dom"];
    return days[offset];
  };

  // Generar próximos 4 días
  const getNextDays = () => {
    const days = [];
    const today = new Date();
    
    for (let i = 0; i < 4; i++) {
      const date = new Date();
      date.setDate(today.getDate() + i);
      days.push({
        date: date,
        name: getDayName(date, i),
        formatted: formatDate(date)
      });
    }
    
    return days;
  };
   const [workSchedule, setWorkSchedule] = useState({
      startTime: "08:00:00", // Inicio de jornada
      endTime: "18:00:00",   // Fin de jornada
    });

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

const handleDateClick = (info) => {

    //Aqui obtenemos la fecha clickeada en un objeto date
    const clickedDate = info.date
    //Extraemos el dia de la semana usando getDay
    const dayWeek = clickedDate.getDay()

    //Validamos si es domingo "0" y detenemos la función
    if(dayWeek === 0) {
      alert("No se pueden crear citas los domingos")
      return;
    }

    //Extraemos solo la fecha convirtiendo el objeto Date en un formato de zona [1] y fecha [0] separados por "T"
    const fecha = clickedDate.toLocaleDateString("sv-SE")

    //Extraemos solo la hora del formato de zona horaria y tiempo
    const hora = clickedDate.toTimeString().slice(0,5)

    //Actualizamos los estados del formulario con la fecha selecionada y una hora de inicio para la cita
    setAppointmentDate(fecha);
    setAppointmentStartTime(hora);


    //Aqui creado un tiempo de duración para nuestra cita segun el tipo de servicio que seleccionemos.
    const service = services.find(serv => serv._id.toString() === selectedService)
    if (service) {
      setAppointmentEndTime(calculateEndTime(hora, service.duration))
    }

    setIsFormVisible(true);
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

  // Horarios de ejemplo (deberían venir de la base de datos)
  const generateSampleHours = () => {
    const hours = [];
    const timeSlots = ["10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30"];
    
    // Solo algunos horarios aleatorios para demostración
    for (let i = 0; i < 4; i++) {
      const availableSlots = [];
      for (let j = 0; j < Math.floor(Math.random() * 4) + 1; j++) {
        availableSlots.push(timeSlots[Math.floor(Math.random() * timeSlots.length)]);
      }
      hours.push(availableSlots);
    }
    
    return hours;
  };

  const handleServiceChange = (e) => {
    const selectedServiceId = e.target.value;
    setSelectedService(selectedServiceId);

    const service = services.find((s) => s._id === selectedServiceId);
    if (service) {
      setAppointmentDuration(service.duration); // Asignar duración predefinida
      setCost(service.cost); // Asignar costo
      if (appointmentStartTime) {
        setAppointmentEndTime(calculateEndTime(appointmentStartTime, service.duration));
      }
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [patientsRes, therapistsRes, serviceRes] = await Promise.all([
          axios.get("/api/patient"),
          axios.get("/api/therapist"),
          axios.get("/api/service"),
        ]);

        setServices(serviceRes.data.services || [])
        setPatients(patientsRes.data.patient || []);
        
        // Añadir datos de muestra a los terapeutas
        const therapistsWithData = (therapistsRes.data.therapist || []).map(therapist => ({
          ...therapist,
          rating: Math.floor(Math.random() * 400) + 100,
          hours: generateSampleHours(),
          fee: 800 + Math.floor(Math.random() * 200) // Tarifa entre 800 y 1000
        }));
        
        setTherapists(therapistsWithData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  const nextDays = getNextDays();

  const handleTimeSlotClick = (therapistId, date, time) => {
    setSelectedTherapist(therapistId);
    setAppointmentDate(date.toISOString().split('T')[0]);
    setAppointmentStartTime(time);
    setIsFormVisible(true);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">DESTACADO</h1>
      
      {therapists.map((therapist) => (
        <div key={therapist._id} className="bg-transparent shadow-lg rounded-lg p-6 mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-white">Dr. {therapist.firstName} {therapist.lastName}</h2>
              <p className="text-white">{therapist.specialization}</p>
              <div className="flex items-center mt-1">
                <div className="flex text-yellow-400">
                  {"★".repeat(5)}
                </div>
                <span className="text-white ml-2">Correo: {therapist.email}</span>
              </div>
            </div>

          </div>

          <div className="mt-4">
            <FullCalendar
                      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                      initialView="timeGridWeek"
                      events={appointments}
                      editable={true}
                      selectable={true} // 🔹 Permite seleccionar rangos de tiempo
                      eventDrop={handleEventDrop} // 🔹 Detecta cuando se mueve un evento
                      dateClick={handleDateClick}
                      eventClick={handleEventClick}
                      hiddenDays={[0]} // Permite esconder el dia domingo
                      eventContent={(eventInfo) => {
            
                        const eventPatient = patients.find((p) => p._id === eventInfo.event.extendedProps.patient);
                        const eventTherapist = therapists.find((t) => t._id === eventInfo.event.extendedProps.therapist);
                        const colorStyle = getEventColor(eventInfo.event.title);
                        return (
                          <div className="custom-event-content text-white">
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
        </div>
      ))}

      {isFormVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Crear Nueva Cita</h2>
              <button
                onClick={() => setIsFormVisible(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
              <div>
                <label className="block mb-1 font-medium">Paciente:</label>
                <select
                  value={selectedPatient}
                  onChange={(e) => setSelectedPatient(e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="">Seleccione un paciente</option>
                  {patients.map((patient) => (
                    <option key={patient._id} value={patient._id}>
                      {patient.firstName} {patient.lastName}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block mb-1 font-medium">Servicio:</label>
                <select
                  value={selectedService}
                  onChange={handleServiceChange}
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="">Seleccione un servicio</option>
                  {services.map((service) => (
                    <option key={service._id} value={service._id}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block mb-1 font-medium">Fecha:</label>
                <input
                  type="date"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              
              <div>
                <label className="block mb-1 font-medium">Hora de inicio:</label>
                <TimePicker
                  format="HH:mm"
                  value={appointmentStartTime ? new Date(`2023-01-01T${appointmentStartTime}`) : null}
                  onChange={(newValue) => {
                    if (newValue) {
                      const formattedTime = newValue.toTimeString().slice(0, 5);
                      setAppointmentStartTime(formattedTime);
                    }
                  }}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              
              <div>
                <label className="block mb-1 font-medium">Costo:</label>
                <input
                  type="number"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsFormVisible(false)}
                  className="px-4 py-2 border rounded"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded"
                >
                  Crear Cita
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Citas;