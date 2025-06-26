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
    transform: "translateY(-50%)", // Centra verticalmente
    width: "400px",
    maxHeight: "90vh",
    margin: 0,
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    overflowY: "auto", // Scroll interno solo si es necesario
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
  

  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [modalType, setModalType] = useState(null); // "details" o "edit"
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  //UseState para servicios obtenidos desde api/services
  const [services, setServices] = useState([])

 const [workSchedule, setWorkSchedule] = useState({
    startTime: "08:00:00", // Inicio de jornada
    endTime: "18:00:00",   // Fin de jornada
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

        setServices(serviceRes.data.services || [])
        setPatients(patientsRes.data.patient || []);
        setTherapists(therapistsRes.data.therapist || []);

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

  //Permite obtener la información de service y actualizar la información  dentro de el calendario permitiendo de esta manera que se vizualicen colores o nombres diferentes.
  useEffect(() => {

    if (services.length === 0 ) return

    const fetchAppointments = async () => {
      try{
        const response = await axios.get("/api/date")
        const appointmentData = response.data?.date || []

        const colorAppointments = appointmentData.map((appointment) => {const service = services.find((s) => s.name === appointment.title)
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
          }
        })
        setAppointments(colorAppointments)
      } catch (error) {
        console.error("Error cargando citas:", error)
      }
    }
    fetchAppointments()
  }, [services])


  //Sirve para cargar los datos desde la BD y actualizar el calendario 
  const refetchAppointments = async () => {
    try{
      const response = await axios.get("/api/date")
      const appointmentData = response.data?.date || []

      const colorAppointments = appointmentData.map((appointment) => {
        //Obtenemos el servicio por su Id
        let service = services.find((s) => s._id.toString() === appointment.serviceId?.toString())

        if(!service && appointment.title){
          service = services.find((s) => s.name === appointment.title)
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
        }
      })
      setAppointments(colorAppointments) //Guardamos la consulta de collorAppoidments dentro de setAppointments para actualizar FullCalendar sin recargar pagina
    } catch (error) {
      console.error("Error cargando citas:", error)
    }
  }


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
  
 
  const getEventColor = (serviceName) => {
    const service = services.find((s) => s.name === serviceName)
    return {
      backgroundColor: service?.color || "#bdc3c7",
      borderColor: "#000"
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

    const service = services.find((s) => s._id === selectedServiceId);
    if (service) {
      setAppointmentDuration(service.duration); // Asignar duración predefinida
      setCost(service.cost); // Asignar costo
      if (appointmentStartTime) {
        setAppointmentEndTime(calculateEndTime(appointmentStartTime, service.duration));
      }
    }
  };


  const convertToLocalDate = (dateStr, timeStr) => {
    const [year, month, day] = dateStr.split("-")
    const [hours, minutes] = timeStr.split(":")

    if(!year || !month || !day || !hours || ! minutes){
      return null;
    }

    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hours),
      Number(minutes)
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    //Verificamos si la fecha seleccionada es domingo extrayendo un objeto tipo Date de appointmentDate y obtenemos el dia de selectedDate con getUTCDay()
    const selectedDate = new Date(appointmentDate)
    const dayWeek = selectedDate.getUTCDay()

    //Si es domingo, no permite enviar la cita y detiene la función
    if (dayWeek === 0){
      alert("No se puede registrar citas en domingo")
      return;
    }

    const therapist = therapists.find((t) => t._id === selectedTherapist);
    const therapistName = therapist
      ? `${therapist.firstName} ${therapist.lastName}`
      : "";

    const patient = patients.find((p) => p._id === selectedPatient);
    const patientName = patient
      ? `${patient.firstName} ${patient.lastName}`
      : "";

    const service = services.find((s) => s._id.toString() === selectedService);

    const appointmentData = {
      idDate: uniquid(),
      date: appointmentDate,
      start: convertToLocalDate(appointmentDate ,appointmentStartTime),
      end: convertToLocalDate(appointmentDate ,appointmentEndTime),
      duration: appointmentDuration,
      therapist: therapist,
      patient: patient,
      title: service?.name || "",
      description: service?.name || "",
      cost: parseFloat(cost),
      serviceId: service?._id
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

      //window.location.reload(); //Recargar pagina de forma temporal para observar la cita creada.
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
      

      {/* Modal de detalles */}
      {modalType === "details" && selectedAppointment && (
        <Modal
          isOpen={modalType === "details"}
          onRequestClose={closeModal}
          style={customStyles}
          ariaHideApp={false}
        >
          <div className="relative">
            <h2 className="text-white font-bold text-xl mb-4">
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
          shouldCloseOnOverlayClick={true}
          onAfterOpen={() => document.body.style.overflow = "hidden"}
          onAfterClose={() => document.body.style.overflow = "auto"}
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
            selectedPatient={selectedAppointment.patient}
            selectedTherapist={selectedAppointment.therapist}
            //Permite detectar el servicio con el que se esta abriendo la cita
            selectedService={selectedAppointment.serviceId}
            appointmentDate={selectedAppointment.start.toISOString().split("T")[0]}
            appointmentStartTime={selectedAppointment.start.toTimeString().slice(0, 5)}
            appointmentEndTime={selectedAppointment.end.toTimeString().slice(0, 5)}
            appointmentDuration={selectedAppointment.duration}
            cost={selectedAppointment.cost}
            onClose={closeModal}
            //Permite cargar las citas una vez estas son actualizadas
            onUpdate={refetchAppointments}
          />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Citas;