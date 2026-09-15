"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

// FullCalendar + sus plugins viven en su propio chunk (se carga vía
// next/dynamic desde app/citas/page.jsx) para no sumar su peso al bundle
// inicial de la Agenda. No contiene lógica propia: solo reenvía las props
// que ya arma app/citas/page.jsx.
export default function FullCalendarView(props) {
  return (
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
      {...props}
    />
  );
}
