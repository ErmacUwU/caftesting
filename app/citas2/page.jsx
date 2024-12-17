'use client'
import React, { useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import "./app.css";

const MyCalendar = () => {
  const [events, setEvents] = useState([
    {
      id: 1,
      title: "Consulta",
      paciente: "Juan Pérez",
      servicio: "Psicología",
      start: "2024-12-27T10:00:00",
      end: "2024-12-27T11:00:00",
      backgroundColor: "#ff5733",
      borderColor: "#c70039",
    },
    {
      id: 2,
      title: "Terapia",
      paciente: "Ana López",
      servicio: "Terapia Física",
      start: "2024-12-27T14:00:00",
      end: "2024-12-27T15:30:00",
      backgroundColor: "#2ecc71",
      borderColor: "#27ae60",
    },
  ]);

  // Personalizar el contenido del evento
  const renderEventContent = (eventInfo) => {
    return (
      <div className="custom-event">
        <div>
          <strong>{eventInfo.event.title}</strong>
        </div>
        <div className="event-details">
          Paciente: {eventInfo.event.extendedProps.paciente}
        </div>
        <div className="event-details">
          Servicio: {eventInfo.event.extendedProps.servicio}
        </div>
        <div className="event-details">Horario: {eventInfo.timeText}</div>
      </div>
    );
  };

  return (
    <div className="calendar-container">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        events={events}
        editable={true}
        selectable={true}
        eventContent={renderEventContent}
        slotLabelFormat={{
          hour: "numeric",
          minute: "2-digit",
          meridiem: "short",
          hour12: true, // Formato 12 horas
        }}
        eventTimeFormat={{
          hour: "numeric",
          minute: "2-digit",
          meridiem: "short",
          hour12: true, // Formato 12 horas
        }}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "timeGridWeek,timeGridDay",
        }}
        buttonText={{
          today: "Hoy",
          week: "Semana", // Personaliza "Week"
          day: "Día",     // Personaliza "Day"
        }}
        locale="es"
        height="auto"
      />
    </div>
  );
};

export default MyCalendar;

