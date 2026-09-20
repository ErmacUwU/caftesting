'use client'
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import axios from 'axios';
import Modal from 'react-modal';
import BotonDeleteCitas from './BotonDeleteCitas';
import ActualizarCita from './ActualizarCitas';
import Spinner from './Spinner';
import useDebounce from '@/hooks/useDebounce';
import { CLINIC_TIMEZONE, zonedTimeToUtc, formatZonedDate, formatZonedTime } from '@/lib/clinicTime';
/* xlsx (creación de Excel) y file-saver (descarga) solo se necesitan al
 exportar, así que se importan de forma perezosa dentro de exportToExcel
 en vez de sumarse al bundle inicial de esta vista. */

// Primer y último día del mes actual, en formato "YYYY-MM-DD" (para los
// inputs de fecha). Es el rango que se carga por defecto al entrar a
// Agendas — antes se traía la colección COMPLETA de citas sin importar
// fecha (miles de registros), lo que por sí solo tardaba varios segundos
// y bloqueaba la pestaña en cada carga.
function getCurrentMonthRange() {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const fmt = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { start: fmt(first), end: fmt(last) };
}

const TarjetaCitas = () => {
  const defaultRange = useMemo(() => getCurrentMonthRange(), []);
  const [startDate, setStartDate] = useState(defaultRange.start);
  const [endDate, setEndDate] = useState(defaultRange.end);

  const [dates, setDates] = useState([]);
  const [loadingDates, setLoadingDates] = useState(true);
  const [therapists, setTherapists] = useState([]);
  const [patients, setPatients] = useState([]);
  const [services, setServices] = useState([]);

  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [selectedTherapist, setSelectedTherapist] = useState('');
  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [therapistFilterSearch, setTherapistFilterSearch] = useState('');
  const [patientFilterSearch, setPatientFilterSearch] = useState('');
  const [filtersVisible, setFiltersVisible] = useState(false);

  const debouncedTherapistFilterSearch = useDebounce(therapistFilterSearch, 300);
  const debouncedPatientFilterSearch = useDebounce(patientFilterSearch, 300);

  const toggleFilters = useCallback(() => {
    setFiltersVisible((prev) => !prev);
  }, []);

  // Función robusta para obtener nombres (maneja perfiles de UserTrue poblados)
  const getNombre = useCallback((entidad) => {
    if (!entidad) return "No asignado";

    const f =
      entidad.firstName ||
      entidad.patientProfile?.firstName ||
      entidad.therapistProfile?.firstName ||
      entidad.name ||
      "";

    const l =
      entidad.lastName ||
      entidad.patientProfile?.lastName ||
      entidad.therapistProfile?.lastName ||
      "";

    const nombreCompleto = `${f} ${l}`.trim();
    return nombreCompleto.length > 0 ? nombreCompleto : "Nombre no encontrado";
  }, []);

  // Catálogos completos de pacientes/terapeutas/servicios: se cargan una
  // sola vez, igual que en app/citas/page.jsx, y NO dependen del rango de
  // fechas visible — así el filtro sigue permitiendo elegir a cualquier
  // terapeuta/paciente aunque no tenga citas en el rango actual.
  useEffect(() => {
    const fetchCatalogs = async () => {
      try {
        const [patientsRes, therapistsRes, servicesRes] = await Promise.all([
          axios.get("/api/usuarioTrue?role=patient"),
          axios.get("/api/usuarioTrue?role=therapist"),
          axios.get("/api/service"),
        ]);
        setPatients(patientsRes.data.users || patientsRes.data || []);
        setTherapists(therapistsRes.data.users || therapistsRes.data || []);
        setServices(servicesRes.data.services || []);
      } catch (error) {
        console.error("Error al cargar catálogos:", error);
      }
    };
    fetchCatalogs();
  }, []);

  // Trae SOLO las citas del rango de fechas seleccionado (por defecto, el
  // mes actual) en vez de la colección completa.
  const fetchAppointments = useCallback(async () => {
    if (!startDate || !endDate) return;
    setLoadingDates(true);
    try {
      const params = {
        start: zonedTimeToUtc(startDate, "00:00", CLINIC_TIMEZONE).toISOString(),
        end: zonedTimeToUtc(endDate, "23:59", CLINIC_TIMEZONE).toISOString(),
      };
      const res = await axios.get("/api/date", { params });
      setDates(res.data.date || []);
    } catch (error) {
      console.error("Error al cargar citas:", error);
      setDates([]);
    } finally {
      setLoadingDates(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const resetToCurrentMonth = useCallback(() => {
    const r = getCurrentMonthRange();
    setStartDate(r.start);
    setEndDate(r.end);
  }, []);

  const clearSecondaryFilters = useCallback(() => {
    setSelectedTherapist('');
    setSelectedPatient('');
    setSelectedService('');
    setTherapistFilterSearch('');
    setPatientFilterSearch('');
  }, []);

  // Filtros de terapeuta/paciente/servicio: se aplican en el cliente, pero
  // solo sobre las citas del rango ya traído del servidor.
  const filteredDates = useMemo(() => {
    return dates.filter((d) => {
      const therapistId = d.therapist?._id || d.therapist;
      const patientId = d.patient?._id || d.patient;
      const serviceId = d.serviceId ? d.serviceId.toString() : "";
      return (
        (!selectedTherapist || therapistId === selectedTherapist) &&
        (!selectedPatient || patientId === selectedPatient) &&
        (!selectedService || serviceId === selectedService)
      );
    });
  }, [dates, selectedTherapist, selectedPatient, selectedService]);

  // Orden alfabético por defecto + filtro por la barra de búsqueda (con
  // debounce) de cada selector. El elemento ya seleccionado se mantiene
  // visible aunque no coincida con la búsqueda, para no perder la
  // selección del <select>.
  const visibleFilterTherapists = useMemo(
    () =>
      [...therapists]
        .sort((a, b) => getNombre(a).localeCompare(getNombre(b), "es", { sensitivity: "base" }))
        .filter(
          (therapist) =>
            therapist._id === selectedTherapist ||
            getNombre(therapist).toLowerCase().includes(debouncedTherapistFilterSearch.trim().toLowerCase())
        ),
    [therapists, selectedTherapist, debouncedTherapistFilterSearch, getNombre]
  );

  const visibleFilterPatients = useMemo(
    () =>
      [...patients]
        .sort((a, b) => getNombre(a).localeCompare(getNombre(b), "es", { sensitivity: "base" }))
        .filter(
          (patient) =>
            patient._id === selectedPatient ||
            getNombre(patient).toLowerCase().includes(debouncedPatientFilterSearch.trim().toLowerCase())
        ),
    [patients, selectedPatient, debouncedPatientFilterSearch, getNombre]
  );

  const sortedServices = useMemo(
    () => [...services].sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" })),
    [services]
  );

  const rangeDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    return Math.round((new Date(endDate) - new Date(startDate)) / 86400000);
  }, [startDate, endDate]);

  const formatToLocalDate = useCallback((dateString) => {
    const [year, month, day] = dateString.split("T")[0].split("-");
    const localDate = new Date(year, month - 1, day);
    return localDate.toLocaleDateString("es-ES", { timeZone: CLINIC_TIMEZONE });
  }, []);

  const formatToLocalTime = useCallback((dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: CLINIC_TIMEZONE });
  }, []);

  const exportToExcel = useCallback(async () => {
    if (filteredDates.length === 0) {
      alert("No hay citas para exportar.");
      return;
    }

    const dataToExport = filteredDates.map((cita) => ({
      Servicio: cita.title,
      Terapeuta: getNombre(cita.therapist),
      Paciente: getNombre(cita.patient),
      Fecha: new Date(cita.date).toLocaleDateString("es-MX"),
      HoraInicio: new Date(cita.date).toLocaleTimeString("es-MX", { hour: '2-digit', minute: '2-digit' }),
      HoraFin: new Date(cita.end).toLocaleTimeString("es-MX", { hour: '2-digit', minute: '2-digit' }),
      Duración: `${cita.duration} minutos`,
      Costo: `$${cita.cost}`,
    }));

    // Carga perezosa: xlsx y file-saver solo se descargan al exportar.
    const [XLSX, fileSaverModule] = await Promise.all([
      import("xlsx"),
      import("file-saver"),
    ]);
    const saveAs = fileSaverModule.saveAs || fileSaverModule.default;

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Agendas");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(data, "Agendas.xlsx");
  }, [filteredDates, getNombre]);

  const hasSecondaryFilters = Boolean(selectedTherapist || selectedPatient || selectedService);

  return (
    <div className="space-y-4">
      {/* Barra de rango de fechas + acciones principales */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex-1 grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                Desde
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                Hasta
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={resetToCurrentMonth}
              className="text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-2 rounded-lg transition whitespace-nowrap"
            >
              Mes actual
            </button>
            <button
              type="button"
              onClick={toggleFilters}
              className={`text-xs font-semibold px-3 py-2 rounded-lg transition whitespace-nowrap ${
                filtersVisible ? "bg-sky-500 text-white hover:bg-sky-600" : "bg-sky-50 text-sky-600 hover:bg-sky-100"
              }`}
            >
              {filtersVisible ? "Ocultar filtros" : "Más filtros"}
            </button>
            <button
              type="button"
              onClick={exportToExcel}
              className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg shadow-sm transition whitespace-nowrap"
            >
              Exportar a Excel
            </button>
          </div>
        </div>

        {rangeDays > 120 && (
          <div className="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
            <span className="text-amber-500 text-xs leading-none mt-0.5">⚠️</span>
            <p className="text-[11px] text-amber-700 leading-snug">
              Estás consultando un rango de {rangeDays} días. Rangos muy amplios tardan más en cargar.
            </p>
          </div>
        )}

        {filtersVisible && (
          <div className="mt-5 pt-5 border-t border-slate-100 grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                Terapeuta
              </label>
              <div className="relative mb-2">
                <input
                  type="text"
                  value={therapistFilterSearch}
                  onChange={(e) => setTherapistFilterSearch(e.target.value)}
                  placeholder="Buscar terapeuta..."
                  className="w-full text-sm p-2 pl-8 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none text-slate-700"
                />
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
              </div>
              <select
                value={selectedTherapist}
                onChange={(e) => setSelectedTherapist(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 focus:ring-2 focus:ring-sky-400 outline-none"
              >
                <option value="">Todos</option>
                {visibleFilterTherapists.map((therapist) => (
                  <option key={therapist._id} value={therapist._id}>
                    {getNombre(therapist)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                Paciente
              </label>
              <div className="relative mb-2">
                <input
                  type="text"
                  value={patientFilterSearch}
                  onChange={(e) => setPatientFilterSearch(e.target.value)}
                  placeholder="Buscar paciente..."
                  className="w-full text-sm p-2 pl-8 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none text-slate-700"
                />
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
              </div>
              <select
                value={selectedPatient}
                onChange={(e) => setSelectedPatient(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 focus:ring-2 focus:ring-sky-400 outline-none"
              >
                <option value="">Todos</option>
                {visibleFilterPatients.map((patient) => (
                  <option key={patient._id} value={patient._id}>
                    {getNombre(patient)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                Servicio
              </label>
              {/* Spacer: alinea este <select> con los de Terapeuta/Paciente,
                  que tienen un buscador de por medio y este no necesita. */}
              <div className="mb-2 h-[34px]" aria-hidden="true" />
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 focus:ring-2 focus:ring-sky-400 outline-none"
              >
                <option value="">Todos</option>
                {sortedServices.map((service) => (
                  <option key={service._id} value={service._id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {hasSecondaryFilters && (
          <div className="mt-3">
            <button
              type="button"
              onClick={clearSecondaryFilters}
              className="text-xs text-slate-400 hover:text-slate-600 font-medium"
            >
              Limpiar filtros de terapeuta/paciente/servicio
            </button>
          </div>
        )}
      </div>

      {/* Resultados */}
      {loadingDates ? (
        <Spinner label="Cargando citas..." />
      ) : filteredDates.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center">
          <p className="text-slate-400 text-sm">
            No hay citas en este rango con los filtros seleccionados.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-slate-400 font-medium px-1">
            {filteredDates.length} cita{filteredDates.length === 1 ? "" : "s"} encontrada{filteredDates.length === 1 ? "" : "s"}
          </p>
          {filteredDates.map((d) => (
            <div
              key={d._id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-100">
                    {d.title || "Sin servicio"}
                  </span>
                  <span className="text-xs text-slate-400">
                    {formatToLocalDate(d.date)} · {formatToLocalTime(d.start)} – {formatToLocalTime(d.end)}
                  </span>
                </div>
                <p className="text-sm text-slate-700">
                  <span className="font-semibold text-slate-800">Terapeuta:</span> {getNombre(d.therapist)}
                </p>
                <p className="text-sm text-slate-700">
                  <span className="font-semibold text-slate-800">Paciente:</span> {getNombre(d.patient)}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAppointment(d);
                    setIsEditModalOpen(true);
                  }}
                  className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-md transition text-sm font-medium"
                >
                  Editar
                </button>
                <BotonDeleteCitas
                  id={d._id}
                  recurrenceGroupId={d.recurrenceGroupId}
                  onDeleted={fetchAppointments}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isEditModalOpen}
        onRequestClose={() => setIsEditModalOpen(false)}
        ariaHideApp={false}
        style={{
          overlay: { backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)", zIndex: 2100 },
          content: {
            top: "50%",
            left: "50%",
            right: "auto",
            bottom: "auto",
            transform: "translate(-50%, -50%)",
            padding: "24px",
            width: "480px",
            maxWidth: "95%",
            maxHeight: "90vh",
            overflowY: "auto",
            borderRadius: "16px",
            border: "1px solid #e5e7eb",
            background: "#ffffff",
            color: "#1f2937",
            boxShadow: "0 15px 35px rgba(0,0,0,0.20)",
          },
        }}
      >
        <div className="relative text-slate-800">
          <button
            onClick={() => setIsEditModalOpen(false)}
            className="absolute top-0 right-0 bg-gray-200 hover:bg-gray-300 text-gray-800 p-1 rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold"
          >
            ✕
          </button>
          <h2 className="text-lg font-bold mb-3">Editar cita</h2>

          {selectedAppointment && (
            <ActualizarCita
              id={selectedAppointment._id}
              selectedPatient={selectedAppointment.patient?._id || selectedAppointment.patient}
              selectedTherapist={selectedAppointment.therapist?._id || selectedAppointment.therapist}
              selectedService={selectedAppointment.serviceId || ""}
              appointmentDate={selectedAppointment.date ? new Date(selectedAppointment.date).toISOString().split('T')[0] : ""}
              appointmentStartTime={new Date(selectedAppointment.start).toTimeString().slice(0, 5)}
              appointmentEndTime={new Date(selectedAppointment.end).toTimeString().slice(0, 5)}
              appointmentDuration={selectedAppointment.duration}
              cost={selectedAppointment.cost}
              preloadedPatients={patients}
              preloadedTherapists={therapists}
              preloadedServices={services}
              onClose={() => setIsEditModalOpen(false)}
              onUpdate={() => {
                setIsEditModalOpen(false);
                fetchAppointments();
              }}
            />
          )}
        </div>
      </Modal>
    </div>
  );
}

export default TarjetaCitas;
