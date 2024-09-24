"use client";
import React, { useState, useEffect } from "react";
import { Document, Packer, Paragraph, TextRun } from "docx";
import axios from "axios";

const Reportes = () => {
  const [patients, setPatients] = useState([]);
  const [therapists, setTherapists] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  // Cargar los datos de pacientes, terapeutas y citas
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [patientsRes, therapistsRes, appointmentsRes] = await Promise.all([
          axios.get("/api/patient"),
          axios.get("/api/therapist"),
          axios.get("/api/date"),
        ]);

        setPatients(patientsRes.data.patient || []);
        setTherapists(therapistsRes.data.therapist || []);
        setAppointments(appointmentsRes.data.date || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  // Filtrar citas cuando un paciente es seleccionado
  useEffect(() => {
    if (selectedPatient) {
      const patientAppointments = appointments.filter(
        (appointment) => appointment.patient === selectedPatient
      );
      setFilteredAppointments(patientAppointments);
      setSelectedAppointment(patientAppointments.length > 0 ? patientAppointments[0] : null);
    } else {
      setFilteredAppointments([]);
      setSelectedAppointment(null);
    }
  }, [selectedPatient, appointments]);

  // Función para generar el documento .docx
  const generateDocx = () => {
    if (!selectedAppointment) {
      alert("Por favor, selecciona una cita");
      return;
    }

    const { date, patient, therapist, description, cost } = selectedAppointment;
    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "Reporte de Citas",
                  bold: true,
                  size: 28,
                }),
              ],
            }),
            new Paragraph(`Fecha: ${new Date(date).toLocaleDateString()}`),
            new Paragraph(`Paciente: ${patient}`),
            new Paragraph(`Terapeuta: ${therapist}`),
            new Paragraph(`Servicio: ${description}`),
            new Paragraph(`Costo: $${cost}`),
          ],
        },
      ],
    });

    // Crear el archivo .docx usando la API de Blob
    Packer.toBlob(doc).then((blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "reporte_cita.docx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    });
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Generar Reporte</h2>
      
      {/* Selección del paciente */}
      <div className="mb-4">
        <label className="block mb-2">
          Paciente:
          <select
            value={selectedPatient}
            onChange={(e) => setSelectedPatient(e.target.value)}
            className="border rounded p-2 w-full"
          >
            <option value="">Seleccione un paciente</option>
            {patients.map((patient) => (
              <option key={patient._id} value={patient._id}>
                {patient.firstName} {patient.lastName}
              </option>
            ))}
          </select>
        </label>

        {/* Mostrar citas filtradas si existen */}
        {filteredAppointments.length > 0 && (
          <div className="mb-4">
            <label className="block mb-2">
              Seleccionar cita:
              <select
                value={selectedAppointment ? selectedAppointment.idDate : ""}
                onChange={(e) =>
                  setSelectedAppointment(
                    filteredAppointments.find((appointment) => appointment.idDate === e.target.value)
                  )
                }
                className="border rounded p-2 w-full"
              >
                {filteredAppointments.map((appointment) => (
                  <option key={appointment.idDate} value={appointment.idDate}>
                    {new Date(appointment.date).toLocaleDateString()} - {appointment.description}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        {/* Mostrar la cita seleccionada si existe */}
        {selectedAppointment && (
          <div className="border p-4 mt-4 rounded">
            <h3 className="text-lg font-bold">Cita Seleccionada</h3>
            <p>Fecha: {new Date(selectedAppointment.date).toLocaleDateString()}</p>
            <p>Terapeuta: {selectedAppointment.therapist}</p>
            <p>Servicio: {selectedAppointment.description}</p>
            <p>Costo: ${selectedAppointment.cost}</p>
          </div>
        )}
      </div>

      {/* Botón para generar el reporte */}
      <button
        onClick={generateDocx}
        className="bg-blue-500 text-white px-4 py-2 rounded"
        disabled={!selectedAppointment}
      >
        Descargar Reporte
      </button>
    </div>
  );
};

export default Reportes;
