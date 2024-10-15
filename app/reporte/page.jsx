"use client"; // Indica que es un componente cliente
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Document, Packer, Paragraph, TextRun } from "docx"; // Importar para crear documentos DOCX

const Reportes = () => {
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [selectedAppointmentId, setSelectedAppointmentId] = useState("");
  const [observations, setObservations] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [patientsRes, appointmentsRes] = await Promise.all([
          axios.get("/api/patient"),
          axios.get("/api/date"),
        ]);
        
        // Asegurarse de que los datos tengan el formato esperado
        setPatients(patientsRes.data.patient || []);
        const appointmentsData = appointmentsRes.data.date.map((appointment) => ({
          idDate: appointment.idDate,
          date: appointment.date,
          therapist: appointment.therapist,
          patient: appointment.patient, // Este debería ser idPatient si coincide con el modelo Patient
          description: appointment.description,
          cost: appointment.cost,
        })) || [];
        setAppointments(appointmentsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const filteredAppointments = appointments.filter(
    (appointment) => appointment.patient === selectedPatient
  );

  const generateDocx = async () => {
    if (!selectedAppointmentId) {
      alert("Por favor, selecciona una cita");
      return;
    }

    const appointment = appointments.find(appt => appt.idDate === selectedAppointmentId);
    if (!appointment) return;

    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              children: [new TextRun({ text: "Reporte de Citas", bold: true, size: 28 })],
            }),
            new Paragraph(`Fecha: ${new Date(appointment.date).toLocaleDateString()}`),
            new Paragraph(`Paciente: ${appointment.patient}`),
            new Paragraph(`Terapeuta: ${appointment.therapist}`),
            new Paragraph(`Servicio: ${appointment.description}`),
            new Paragraph(`Costo: $${appointment.cost}`),
            new Paragraph("Observaciones:"),
            new Paragraph(observations || "No hay observaciones."),
          ],
        },
      ],
    });

    try {
      const blob = await Packer.toBlob(doc);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "reporte_cita.docx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error generando el docx:", err);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Generar Reporte</h2>
      
      {/* Selector de Paciente */}
      <div className="mb-4">
        <label className="block mb-2">Selecciona un Paciente:</label>
        <select
          value={selectedPatient}
          onChange={(e) => {
            setSelectedPatient(e.target.value);
            setSelectedAppointmentId("");
            setObservations("");
          }}
          className="border rounded p-2 w-full"
        >
          <option value="">Seleccione un paciente</option>
          {patients.map((patient) => (
            <option key={patient.idPatient} value={patient.idPatient}>
              {patient.firstName} {patient.lastName}
            </option>
          ))}
        </select>
      </div>

      {/* Selector de Cita */}
      {filteredAppointments.length > 0 && (
        <div className="mb-4">
          <label className="block mb-2">Selecciona una Cita:</label>
          <select
            value={selectedAppointmentId}
            onChange={(e) => setSelectedAppointmentId(e.target.value)}
            className="border rounded p-2 w-full"
          >
            <option value="">Seleccione una cita</option>
            {filteredAppointments.map((appointment) => (
              <option key={appointment.idDate} value={appointment.idDate}>
                {new Date(appointment.date).toLocaleDateString()} - {appointment.description}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Campo para Observaciones */}
      <div className="mt-4">
        <label className="block mb-2">Observaciones:</label>
        <textarea
          value={observations}
          onChange={(e) => setObservations(e.target.value)}
          className="border rounded p-2 w-full h-24"
        />
      </div>

      {/* Botón para Descargar Reporte */}
      <button
        onClick={generateDocx}
        className="bg-blue-500 text-white px-4 py-2 rounded mt-4"
      >
        Descargar Reporte
      </button>
    </div>
  );
};

export default Reportes;