"use client";
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

const Reporte = () => {
  const [appointments, setAppointments] = useState([]);
  const [selectedTherapist, setSelectedTherapist] = useState("");
  const [selectedPatient, setSelectedPatient] = useState("");
  const [notes, setNotes] = useState("");
  const [images, setImages] = useState([]);
  const pdfRef = useRef();
  const fileInputRef = useRef();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const appointmentsRes = await axios.get("/api/date");
        setAppointments(
          appointmentsRes.data.date.map((appointment) => ({
            id: appointment.idDate,
            therapist: appointment.therapist,
            patient: appointment.patient,
          })) || []
        );
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const uniqueTherapists = [...new Set(appointments.map((a) => a.therapist))];
  const uniquePatients = [...new Set(appointments.map((a) => a.patient))];

  const handleImageChange = (event) => {
    const files = Array.from(event.target.files);
    const newImages = files.map((file) => URL.createObjectURL(file));
    setImages((prevImages) => [...prevImages, ...newImages]);
  };

  const uploadToS3AndSaveToDB = async (pdfBlob) => {
    try {
      // Subir archivo a S3
      const response = await axios.post("/api/s3/upload", {
        name: `${selectedPatient}_reporte_citas.pdf`,
        type: "application/pdf",
      });

      const { url } = response.data;

      await axios.put(url, pdfBlob, {
        headers: { "Content-Type": "application/pdf" },
      });

      // Guardar los datos en MongoDB
      const saveResponse = await axios.post("/api/s3/files", {
        name: `${selectedPatient}_reporte_citas.pdf`,
        type: "application/pdf",
        size: pdfBlob.size,
        url: url.split("?")[0], // URL sin firma
        therapist: selectedTherapist,
        patient: selectedPatient,
        notes,
        images,
      });

      if (saveResponse.status === 201) {
        alert("Archivo guardado en S3 y en MongoDB con éxito!");
      }
    } catch (error) {
      console.error("Error al subir y guardar el archivo:", error);
      alert("Hubo un error al guardar los datos del archivo.");
    }
  };

  const resetInputs = () => {
    setSelectedTherapist("");
    setSelectedPatient("");
    setNotes("");
    setImages([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = null; // Restablecer el input de archivos
    }
  };

  const generateAndUploadPDF = async () => {
    const element = pdfRef.current;

    const options = {
      margin: 1,
      filename: `${selectedPatient}_reporte_citas.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
    };

    try {
      const html2pdfModule = await import("html2pdf.js");
      const pdfBlob = await html2pdfModule.default().from(element).set(options).outputPdf("blob");

      if (pdfBlob.size === 0) {
        console.error("El PDF generado está vacío.");
        alert("Hubo un error al generar el PDF.");
        return;
      }

      // Subir a S3 y guardar en MongoDB
      await uploadToS3AndSaveToDB(pdfBlob);

      // Restablecer inputs después de generar y subir
      resetInputs();
    } catch (error) {
      console.error("Error al generar el PDF:", error);
      alert("Hubo un error al generar el PDF.");
    }
  };

  return (
    <div className="p-4 bg-gray-50 rounded shadow-lg">
      <h1 className="text-2xl font-bold mb-5 text-center">Creador de Reportes para Citas</h1>

      {/* Selección del Terapeuta */}
      <label htmlFor="therapists" className="block mb-1 font-semibold">
        Elige el terapeuta:
      </label>
      <select
        id="therapists"
        value={selectedTherapist}
        onChange={(e) => setSelectedTherapist(e.target.value)}
        className="border border-gray-400 p-2 rounded mb-4 w-full"
      >
        <option value="">--Seleccione un terapeuta--</option>
        {uniqueTherapists.map((therapist, index) => (
          <option key={index} value={therapist}>
            {therapist}
          </option>
        ))}
      </select>

      {/* Selección del Paciente */}
      <label htmlFor="patients" className="block mb-1 font-semibold">
        Elige el paciente:
      </label>
      <select
        id="patients"
        value={selectedPatient}
        onChange={(e) => setSelectedPatient(e.target.value)}
        className="border border-gray-400 p-2 rounded mb-4 w-full"
      >
        <option value="">--Seleccione un paciente--</option>
        {uniquePatients.map((patient, index) => (
          <option key={index} value={patient}>
            {patient}
          </option>
        ))}
      </select>

      {/* Notas */}
      <textarea
        id="notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="border border-gray-400 p-2 rounded mb-4 w-full"
        placeholder="Ingresa tus notas aquí..."
        rows="4"
      />

      {/* Subir Imágenes */}
      <input
        type="file"
        id="images"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleImageChange}
        multiple
        className="border border-gray-400 p-2 rounded mb-4 w-full"
      />

      {/* Botón para generar PDF */}
      <button
        onClick={generateAndUploadPDF}
        className="mt-4 w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        Generar y Guardar PDF
      </button>

      {/* Contenido del PDF */}
      <div ref={pdfRef} className="p-6 bg-white border rounded shadow-md">
        {/* Encabezado */}
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "10px" }}>
            Reporte de Citas
          </h1>
          <p style={{ fontSize: "16px", color: "#555" }}>
            Generado el {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Información Principal */}
        <div style={{ marginBottom: "20px" }}>
          <p>
            <strong>Terapeuta:</strong> {selectedTherapist || "No hay terapeuta seleccionado"}
          </p>
          <p>
            <strong>Paciente:</strong> {selectedPatient || "No hay paciente seleccionado"}
          </p>
        </div>

        {/* Notas */}
        <div style={{ marginBottom: "20px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "10px" }}>Notas:</h2>
          <p style={{ fontSize: "14px", color: "#333" }}>{notes || "No hay notas ingresadas"}</p>
        </div>

        {/* Imágenes */}
        <div style={{ marginBottom: "20px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "10px" }}>Imágenes:</h2>
          {images.length > 0 ? (
            images.map((img, index) => (
              <img
                key={index}
                src={img}
                alt={`uploaded-${index}`}
                style={{
                  maxWidth: "100%",
                  marginBottom: "10px",
                  border: "1px solid #ddd",
                  padding: "5px",
                  borderRadius: "5px",
                }}
              />
            ))
          ) : (
            <p>No hay imágenes subidas.</p>
          )}
        </div>

        {/* Pie de Página */}
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <p style={{ fontSize: "12px", color: "#777" }}>
            Este reporte fue generado automáticamente por el sistema.
          </p>
          <p style={{ fontSize: "12px", fontStyle: "italic", marginTop: "10px", color: "#555" }}>
            Esta es una vista previa del documento.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Reporte;
