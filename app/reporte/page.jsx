'use client';
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext.js"; 
import { useRouter } from "next/navigation";
import axios from "axios";

const Reporte = () => {
  const [appointments, setAppointments] = useState([]);
  const [selectedTherapist, setSelectedTherapist] = useState("");
  const [selectedPatient, setSelectedPatient] = useState("");
  const [notes, setNotes] = useState("");
  const [images, setImages] = useState([]);
  const pdfRef = useRef();
  const fileInputRef = useRef();
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        router.replace('/login'); // Redirige si no está autenticado
      }
  }, [isAuthenticated, isLoading, router]);

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

  if (isLoading) {
    return <div className="text-center py-10">Cargando...</div>;
  }

  if (!isAuthenticated) {
    return null; // Evita mostrar contenido mientras se redirige
  }

  const uniqueTherapists = [...new Set(appointments.map((a) => a.therapist))];
  const uniquePatients = [...new Set(appointments.map((a) => a.patient))];

  const handleImageChange = (event) => {
    const files = Array.from(event.target.files);
    const newImages = files.map((file) => URL.createObjectURL(file));
    setImages((prevImages) => [...prevImages, ...newImages]);
  };

  const uploadToS3AndSaveToDB = async (pdfBlob) => {
    try {
      const response = await axios.post("/api/s3/upload", {
        name: `${selectedPatient}_reporte_citas.pdf`,
        type: "application/pdf",
      });

      const { url } = response.data;

      await axios.put(url, pdfBlob, {
        headers: { "Content-Type": "application/pdf" },
      });

      const saveResponse = await axios.post("/api/s3/files", {
        name: `${selectedPatient}_reporte_citas.pdf`,
        type: "application/pdf",
        size: pdfBlob.size,
        url: url.split("?")[0],
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
      fileInputRef.current.value = null;
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

      await uploadToS3AndSaveToDB(pdfBlob);
      resetInputs();
    } catch (error) {
      console.error("Error al generar el PDF:", error);
      alert("Hubo un error al generar el PDF.");
    }
  };

  return (
    <div className="p-6 bg-gray-50 rounded-lg shadow-lg">
      <h1 className="text-2xl font-extrabold text-center text-gray-800 mb-6">Creador de Reportes para Citas</h1>

      <div className="space-y-6">
        {/* Selección del Terapeuta */}
        <div>
          <label htmlFor="therapists" className="block text-sm font-medium text-gray-700 mb-2">
            Elige el terapeuta:
          </label>
          <select
            id="therapists"
            value={selectedTherapist}
            onChange={(e) => setSelectedTherapist(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">--Seleccione un terapeuta--</option>
            {uniqueTherapists.map((therapist, index) => (
              <option key={index} value={therapist}>
                {therapist}
              </option>
            ))}
          </select>
        </div>

        {/* Selección del Paciente */}
        <div>
          <label htmlFor="patients" className="block text-sm font-medium text-gray-700 mb-2">
            Elige el paciente:
          </label>
          <select
            id="patients"
            value={selectedPatient}
            onChange={(e) => setSelectedPatient(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">--Seleccione un paciente--</option>
            {uniquePatients.map((patient, index) => (
              <option key={index} value={patient}>
                {patient}
              </option>
            ))}
          </select>
        </div>

        {/* Notas */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
            Notas:
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="4"
            placeholder="Ingresa tus notas aquí..."
          />
        </div>

        {/* Subir Imágenes */}
        <div>
          <label htmlFor="images" className="block text-sm font-medium text-gray-700 mb-2">
            Subir Imágenes:
          </label>
          <input
            type="file"
            id="images"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleImageChange}
            multiple
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Botón para generar PDF */}
        <button
          onClick={generateAndUploadPDF}
          className="w-full p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Generar y Guardar PDF
        </button>
      </div>

      {/* Contenido del PDF */}
      <div ref={pdfRef} className="p-6 mt-8 bg-white border rounded-lg shadow-md">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-gray-800">Reporte de Citas</h1>
          <p className="text-gray-600">Generado el {new Date().toLocaleDateString()}</p>
        </div>

        {/* Información Principal */}
        <div className="mb-6">
          <p><strong>Terapeuta:</strong> {selectedTherapist || "No hay terapeuta seleccionado"}</p>
          <p><strong>Paciente:</strong> {selectedPatient || "No hay paciente seleccionado"}</p>
        </div>

        {/* Notas */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold">Notas:</h2>
          <p>{notes || "No hay notas ingresadas"}</p>
        </div>

        {/* Imágenes */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold">Imágenes:</h2>
          {images.length > 0 ? (
            images.map((img, index) => (
              <img
                key={index}
                src={img}
                alt={`uploaded-${index}`}
                className="w-full max-w-md mb-4 border border-gray-200 rounded-lg"
              />
            ))
          ) : (
            <p>No hay imágenes subidas.</p>
          )}
        </div>

        {/* Pie de Página */}
        <div className="text-center mt-6 text-xs text-gray-500">
          <p>Este reporte fue generado automáticamente por el sistema.</p>
          <p className="italic">Esta es una vista previa del documento.</p>
        </div>
      </div>
    </div>
  );
};

export default Reporte;
