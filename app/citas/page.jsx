'use client'

import React from 'react'
import "react-big-calendar/lib/css/react-big-calendar.css";
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from '@fullcalendar/daygrid' // a plugin!
import interactionPlugin from "@fullcalendar/interaction" // needed for dayClick
import '@fullcalendar/core/locales-all'


const Citas = () => {

  const handleDateClick = (arg) => {
    alert(arg.dateStr);
  };

  return (
    <div>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        dateClick={handleDateClick}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        views={{
          dayGridMonth: { buttonText: "Mes" },
          timeGridWeek: { buttonText: "Semana" },
          timeGridDay: { buttonText: "Dia" },
        }}
        locale={"es"}
        buttonText={{
          today: "Hoy",
        }}
      />
    </div>
  );
}

export default Citas






