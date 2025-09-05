"use client";
import React from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

const CalendarioCitas = ({
  events,
  workSchedule,
  patients,
  therapists,
  onEventClick,
  onEventDrop,
  onDateClick,
  onOpenSchedule
}) => {
  return (
    <div className="calendar-container w-2/5 p-4">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        events={events}
        editable={true}
        selectable={true}
        eventDrop={onEventDrop}
        dateClick={onDateClick}
        eventClick={onEventClick}
        hiddenDays={[0]} // sin domingo 
        eventContent={(eventInfo) => {
          const eventPatient = patients.find(
            (p) => p._id === eventInfo.event.extendedProps.patient
          );
          const colorStyle = {
            backgroundColor: eventInfo.event.backgroundColor,
            borderColor: eventInfo.event.borderColor
          };
          return (
            <div className="custom-event-content" style={colorStyle}>
              <div className="custom-hour">{eventInfo.timeText}</div>
              <div className="custom-title">
                {eventPatient
                  ? `${eventPatient.firstName} ${eventPatient.lastName}`
                  : "No encontrado"}
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
        slotMinTime={workSchedule.startTime}
        slotMaxTime={workSchedule.endTime}
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
          horario: "Horario",
        }}
        customButtons={{
          horario: {
            text: "Horario",
            click: () => onOpenSchedule(true),
          },
        }}
      />
    </div>
  );
};

export default CalendarioCitas;