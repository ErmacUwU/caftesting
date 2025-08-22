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
  const [loading, setLoading] = useState(false);
  const pdfRef = useRef();
  const fileInputRef = useRef();
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Redirección si no está autenticado
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Cargar citas desde API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await axios.get("/api/date");
        setAppointments(
          data.date?.map((a) => ({
            id: a.idDate,
            therapist: a.therapist,
            patient: a.patient,
          })) || []
        );
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
  const fetchData = async () => {
    try {
      // Traer citas, terapeutas y pacientes en paralelo
      const [datesRes, therapistsRes, patientsRes] = await Promise.all([
        axios.get("/api/date"),
        axios.get("/api/therapists"),
        axios.get("/api/patients")
      ]);

      // Crear diccionarios { id: nombre }
      const therapistsMap = Object.fromEntries(
        therapistsRes.data.map(t => [t.id, t.name])
      );
      const patientsMap = Object.fromEntries(
        patientsRes.data.map(p => [p.id, p.name])
      );

      // Mapear IDs a nombres
      setAppointments(
        datesRes.data.date?.map(a => ({
          id: a.idDate,
          therapist: therapistsMap[a.therapist] || a.therapist,
          patient: patientsMap[a.patient] || a.patient,
        })) || []
      );

    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  fetchData();
}, []);


  // Limpiar blobs al desmontar
  useEffect(() => {
    return () => {
      images.forEach((img) => URL.revokeObjectURL(img));
    };
  }, [images]);

  if (isLoading) {
    return <div className="text-center py-10">Cargando...</div>;
  }
  if (!isAuthenticated) return null;

  const uniqueTherapists = [...new Set(appointments.map((a) => a.therapist))];
  const uniquePatients = [...new Set(appointments.map((a) => a.patient))];

  // Manejar subida de imágenes
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map((file) => URL.createObjectURL(file));
    setImages((prev) => [...prev, ...newImages]);
  };

  // Subir PDF a S3 y guardar en BD
  const uploadToS3AndSaveToDB = async (pdfBlob) => {
    try {
      const { data } = await axios.post("/api/s3/upload", {
        name: `${selectedPatient}_reporte_citas.pdf`,
        type: "application/pdf",
      });
      const { url } = data;

      await axios.put(url, pdfBlob, {
        headers: { "Content-Type": "application/pdf" },
      });

      await axios.post("/api/s3/files", {
        name: `${selectedPatient}_reporte_citas.pdf`,
        type: "application/pdf",
        size: pdfBlob.size,
        url: url.split("?")[0],
        therapist: selectedTherapist,
        patient: selectedPatient,
        notes,
        images,
      });

      alert("Archivo guardado con éxito!");
    } catch (error) {
      console.error("Error al subir y guardar:", error);
      alert("Hubo un error al guardar el archivo.");
    }
  };

  

  // Limpiar inputs
  const resetInputs = () => {
    setSelectedTherapist("");
    setSelectedPatient("");
    setNotes("");
    setImages([]);
    if (fileInputRef.current) fileInputRef.current.value = null;
  };


  // Generar PDF
  const generateAndUploadPDF = async () => {
    if (!selectedTherapist || !selectedPatient) {
      alert("Debes seleccionar un terapeuta y un paciente antes de continuar.");
      return;
    }

    setLoading(true);
    try {
      const element = pdfRef.current;
      const options = {
        margin: 1,
        filename: `${selectedPatient}_reporte_citas.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
      };

      const html2pdfModule = await import("html2pdf.js");
      const pdfBlob = await html2pdfModule.default()
        .from(element)
        .set(options)
        .output('blob'); 

      if (!pdfBlob || pdfBlob.size === 0) {
        throw new Error("El PDF generado está vacío.");
      }

      await uploadToS3AndSaveToDB(pdfBlob);
      resetInputs();
    } catch (error) {
      console.error("Error generando PDF:", error);
      alert("Hubo un error al generar el PDF.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] text-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-extrabold text-center mb-6">Genera Reporte de Citas</h1>

      <div className="space-y-6">
        {/* Select terapeuta */}
        <div>
          <label className="block text-sm mb-2">Elige el terapeuta:</label>
          <select
            value={selectedTherapist}
            onChange={(e) => setSelectedTherapist(e.target.value)}
            className="w-full p-2 border rounded-lg text-black"
          >
            <option value="">--Seleccione--</option>
            {uniqueTherapists.map((t, i) => (
              <option key={i} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Select paciente */}
        <div>
          <label className="block text-sm mb-2">Elige el paciente:</label>
          <select
            value={selectedPatient}
            onChange={(e) => setSelectedPatient(e.target.value)}
            className="w-full p-2 border rounded-lg text-black"
          >
            <option value="">--Seleccione--</option>
            {uniquePatients.map((p, i) => (
              <option key={i} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* Notas */}
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows="4"
          placeholder="Notas..."
          className="w-full p-2 border rounded-lg text-black"
        />

        {/* Imágenes */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleImageChange}
          multiple
          className="w-full p-2 border rounded-lg text-black"
        />

        {/* Botón PDF */}
        <button
          onClick={generateAndUploadPDF}
          disabled={loading}
          className={`w-full p-3 rounded-lg transition ${loading ? 'bg-gray-500' : 'bg-[#000080] hover:bg-[#1a1a8c]'}`}
        >
          {loading ? "Generando..." : "Generar y Guardar PDF"}
        </button>
      </div>

      {/* Plantilla PDF */}
      <div ref={pdfRef} className="p-6 mt-8 bg-white text-black border rounded-lg hidden-print">
        {/* Encabezado */}
        <div className="bg-[#000080] text-white p-6 rounded-t-lg">
          <h1 className="text-3xl font-bold text-center mb-2">Centro de Apoyo a la Familia</h1>
          <p className="text-center text-sm">
            Diagnóstico y acompañamiento terapéutico en lenguaje, psicología y aprendizaje
          </p>
          <p className="text-center text-sm mt-1">
            para niños con Autismo, Déficit de atención, deficiencia intelectual y más.
          </p>
        </div>

        {/* Información del reporte */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-center text-[#8A2BE2] mb-2">Reporte de Citas</h2>
          <p className="text-center text-gray-600 text-sm">
            Generado el {new Date().toLocaleDateString('es-ES', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        {/* Datos principales */}
        <div className="p-4 grid grid-cols-2 gap-4 border-b border-gray-200">
          <div>
            <p className="font-semibold text-[#8A2BE2]">Terapeuta:</p>
            <p className="text-lg">{selectedTherapist || "No seleccionado"}</p>
          </div>
          <div>
            <p className="font-semibold text-[#8A2BE2]">Paciente:</p>
            <p className="text-lg">{selectedPatient || "No seleccionado"}</p>
          </div>
        </div>

        {/* Notas */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-[#8A2BE2] mb-2">Notas</h3>
          <p className="whitespace-pre-wrap">{notes || "Sin notas registradas"}</p>
        </div>

        {/* Imágenes */}
        {images.length > 0 && (
          <div className="p-4">
            <h3 className="text-xl font-semibold text-[#8A2BE2] mb-4">Imágenes Adjuntas</h3>
            <div className="grid grid-cols-2 gap-4">
              {images.map((img, i) => (
                <div key={i} className="border border-gray-300 rounded-lg overflow-hidden">
                  <img 
                    src={img} 
                    alt={`Imagen adjunta ${i + 1}`} 
                    className="w-full h-48 object-contain"
                  />
                  <p className="text-center py-2 text-sm bg-gray-100">Imagen {i + 1}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pie de página */}
        <div className="bg-[#8A2BE2] text-white p-4 mt-6 rounded-b-lg text-center">
          <p className="font-medium">Reporte generado automáticamente por el sistema</p>
          <p className="text-sm mt-1">Centro de Apoyo a la Familia © {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  );
};

export default Reporte;