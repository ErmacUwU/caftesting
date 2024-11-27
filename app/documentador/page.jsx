"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";

const ConsultaDocumentos = () => {
  const [patients, setPatients] = useState([]); // Lista de pacientes
  const [therapists, setTherapists] = useState([]); // Lista de terapeutas
  const [loadingPatients, setLoadingPatients] = useState(true); // Carga de pacientes
  const [loadingTherapists, setLoadingTherapists] = useState(true); // Carga de terapeutas
  const [selectedPatients, setSelectedPatients] = useState([]); // Pacientes seleccionados
  const [selectedTherapists, setSelectedTherapists] = useState([]); // Terapeutas seleccionados
  const [documents, setDocuments] = useState([]); // Documentos filtrados
  const [loadingDocuments, setLoadingDocuments] = useState(false); // Estado de carga
  const [errorMessage, setErrorMessage] = useState(""); // Mensaje de error

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [patientsRes, therapistsRes] = await Promise.all([
          axios.get("/api/patient"),
          axios.get("/api/therapist"),
        ]);

        setPatients(patientsRes.data.patients || []);
        setTherapists(therapistsRes.data.therapists || []);
      } catch (error) {
        console.error("Error al cargar filtros:", error);
        setErrorMessage("No se pudieron cargar los filtros de pacientes y terapeutas.");
      } finally {
        setLoadingPatients(false);
        setLoadingTherapists(false);
      }
    };

    fetchFilters();
  }, []);

  const handlePatientChange = (patient) => {
    setSelectedPatients((prev) =>
      prev.includes(patient)
        ? prev.filter((p) => p !== patient)
        : [...prev, patient]
    );
  };

  const handleTherapistChange = (therapist) => {
    setSelectedTherapists((prev) =>
      prev.includes(therapist)
        ? prev.filter((t) => t !== therapist)
        : [...prev, therapist]
    );
  };

  const fetchDocuments = async () => {
    setLoadingDocuments(true);
    setErrorMessage("");
    setDocuments([]);

    try {
      const response = await axios.post("/api/s3/documents", {
        patients: selectedPatients,
        therapists: selectedTherapists,
      });

      setDocuments(response.data.documents || []);
      if (response.data.documents.length === 0) {
        setErrorMessage("No se encontraron documentos para los filtros seleccionados.");
      }
    } catch (error) {
      console.error("Error al obtener documentos:", error);
      setErrorMessage("Hubo un error al consultar los documentos.");
    } finally {
      setLoadingDocuments(false);
    }
  };

  return (
    <div className="p-4 bg-gray-50 rounded shadow-lg">
      <h1 className="text-2xl font-bold mb-5 text-center">Consulta de Documentos</h1>

      <div>
        {/* Lista de pacientes */}
        <h2 className="text-lg font-semibold mb-2">Filtrar por Paciente:</h2>
        <div className="mb-4">
          {loadingPatients ? (
            <p className="text-sm text-gray-500">Cargando pacientes...</p>
          ) : patients.length > 0 ? (
            patients.map((patient) => (
              <label key={patient} className="block">
                <input
                  type="checkbox"
                  value={patient}
                  onChange={() => handlePatientChange(patient)}
                  className="mr-2"
                />
                {patient}
              </label>
            ))
          ) : (
            <p className="text-sm text-gray-500">No hay pacientes disponibles.</p>
          )}
        </div>

        {/* Lista de terapeutas */}
        <h2 className="text-lg font-semibold mb-2">Filtrar por Terapeuta:</h2>
        <div className="mb-4">
          {loadingTherapists ? (
            <p className="text-sm text-gray-500">Cargando terapeutas...</p>
          ) : therapists.length > 0 ? (
            therapists.map((therapist) => (
              <label key={therapist} className="block">
                <input
                  type="checkbox"
                  value={therapist}
                  onChange={() => handleTherapistChange(therapist)}
                  className="mr-2"
                />
                {therapist}
              </label>
            ))
          ) : (
            <p className="text-sm text-gray-500">No hay terapeutas disponibles.</p>
          )}
        </div>

        {/* Botón para consultar documentos */}
        <button
          onClick={fetchDocuments}
          disabled={loadingDocuments}
          className={`mt-4 w-full p-2 rounded ${
            loadingDocuments ? "bg-gray-400" : "bg-blue-600 text-white hover:bg-blue-700"
          } transition`}
        >
          {loadingDocuments ? "Consultando..." : "Consultar Documentos"}
        </button>
      </div>

      {/* Resultados */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">Documentos:</h2>
        {errorMessage && <p className="text-sm text-red-500">{errorMessage}</p>}

        {documents.length > 0 && (
          <div>
            {documents.map((doc, index) => (
              <div key={index} className="p-2 mt-2 bg-white shadow rounded">
                <p>
                  <strong>Nombre:</strong> {doc.name}
                </p>
                <p>
                  <strong>Paciente:</strong> {doc.patient}
                </p>
                <p>
                  <strong>Terapeuta:</strong> {doc.therapist}
                </p>
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 underline"
                >
                  Ver Documento
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsultaDocumentos;
