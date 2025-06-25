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

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);



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
    //Contenedor principal
    <div className="flex items-center justify-center h-screen text-center">

      {isFormVisible && (
              <div className="w-1/3 min-w-[300px] p-4 shadow-lg z-20 sticky top-0 h-screen overflow-y-auto ">
                <button
                  onClick={() => setIsFormVisible(false)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded"
                >
                  X
                </button>
                <form onSubmit={handleSubmit} className="mb-4 text-white">
                  <label className="block mb-2">
                    Paciente:
                    <select
                      value={selectedPatient}
                      onChange={(e) => setSelectedPatient(e.target.value)}
                      className="block w-full p-2 border rounded mt-1"
                    >
                      <option value="">Seleccione un paciente</option>
                      {patients.map((patient) => (
                        <option  key={patient._id} value={patient._id}>
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
                      className="select-edit block w-full p-2 border border-gray-300 rounded mt-1"
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
                          const service = services.find((s) => s.id.toString() === selectedService);
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
                      className="block w-full p-2 border border-gray-300 rounded mt-1"
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
      
      {/*Columna 1*/}
      <div className="w-1/2 ">

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


      {/*Columna 2*/}
      <div className="w-1/2 ">

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

    </div>
  );
};

export default Citas;