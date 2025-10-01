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
  const [therapistsList, setTherapistsList] = useState([]);
  const [patientsList, setPatientList] = useState([]);
  const [generating, setGenerating] = useState(false);

  const pdfRef = useRef();
  const fileInputRef = useRef();
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const therapistObj = therapistsList.find(t => t._id === selectedTherapist);
  const patientObj = patientsList.find(p => p._id === selectedPatient);

  // --- Auth gate ---
  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login");
  }, [isAuthenticated, isLoading, router]);

  // --- Carga inicial ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [appointmentsRes, therapistsRes, patientsRes] = await Promise.all([
          axios.get("/api/date"),
          axios.get("/api/therapist"),
          axios.get("/api/patient"),
        ]);
        setAppointments(appointmentsRes.data?.date || []);
        setTherapistsList(therapistsRes.data?.therapist || []);
        setPatientList(patientsRes.data?.patient || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  if (isLoading) return <div className="text-center py-10">Cargando...</div>;
  if (!isAuthenticated) return null;

  // --- Imágenes: guardamos los Object URLs para previsualizar en el PDF ---
  const handleImageChange = (event) => {
    const files = Array.from(event.target.files || []);
    const newImages = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...newImages]);
  };

  // ✅ Sube el PDF a S3 (presigned URL) y guarda registro en BD
  const uploadToS3AndSaveToDB = async (pdfBlob, filename) => {
    try {
      // 1) Pides presigned URL
      const presign = await axios.post("/api/s3/upload", {
        name: filename,
        type: "application/pdf",
      });

      const { url } = presign.data; // URL con query params (firma)

      // 2) Subir binario a S3
      await axios.put(url, pdfBlob, {
        headers: { "Content-Type": "application/pdf" },
      });

      // 3) Guardar registro en tu BD (ajusta la ruta si usas otra)
      const saveResponse = await axios.post("/api/reports", {
        name: filename,
        type: "application/pdf",
        size: pdfBlob.size,
        url: url.split("?")[0], // URL limpia del objeto
        therapist: selectedTherapist,
        patient: selectedPatient,
        notes,
        // Guarda solo las URLs (si luego vas a subir imágenes real a S3, cambia esto)
        images: images.map((i) => i.url),
      });

      if (saveResponse.status === 201) {
        alert("PDF subido a S3 y registrado en BD con éxito.");
      } else {
        alert("Se subió el PDF pero hubo un detalle al guardar en BD.");
      }
    } catch (error) {
      console.error("Error al subir/guardar:", error);
      alert("Hubo un error al subir el PDF o guardar en BD.");
    }
  };

  const resetInputs = () => {
    setSelectedTherapist("");
    setSelectedPatient("");
    setNotes("");
    images.forEach((i) => URL.revokeObjectURL(i.url));
    setImages([]);
    if (fileInputRef.current) fileInputRef.current.value = null;
  };

  // ✅ Genera el PDF desde el contenido de pdfRef (forma estable con html2pdf)
  const generatePDFBlob = async () => {
    const element = pdfRef.current;
    if (!element) throw new Error("No hay contenido para PDF.");

    const options = {
      margin: 0.5,
      filename: "reporte.pdf", // se ignora aquí; el filename real lo controlamos fuera
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
    };

    const html2pdfModule = (await import("html2pdf.js")).default;

    // Cadena estable: toPdf().get('pdf') → pdf.output('blob')
    const worker = html2pdfModule().from(element).set(options).toPdf();
    const pdf = await worker.get("pdf");
    const blob = pdf.output("blob");

    if (!blob || blob.size === 0) throw new Error("PDF vacío.");
    return blob;
  };

  // 👉 Generar y SUBIR
  const generateAndUploadPDF = async () => {
    if (!selectedTherapist || !selectedPatient) {
      alert("Selecciona terapeuta y paciente antes de generar el PDF.");
      return;
    }
    setGenerating(true);
    try {
      const filename = `${selectedPatient}_reporte_citas.pdf`;
      const pdfBlob = await generatePDFBlob();
      await uploadToS3AndSaveToDB(pdfBlob, filename);
      resetInputs();
    } catch (error) {
      console.error("Error al generar/subir PDF:", error);
      alert("Hubo un error al generar/subir el PDF.");
    } finally {
      setGenerating(false);
    }
  };

  // 👉 Generar y DESCARGAR localmente (opcional)
  const generateAndDownloadPDF = async () => {
    setGenerating(true);
    try {
      const filename = `${selectedPatient || "reporte"}_citas.pdf`;
      const pdfBlob = await generatePDFBlob();
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error al descargar PDF:", error);
      alert("Hubo un error al generar el PDF.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 rounded-lg shadow-lg">
      <h1 className="text-2xl font-extrabold text-center text-gray-800 mb-6">
        Creador de Reportes para Citas
      </h1>

      <div className="space-y-6">
        {/* Terapeuta */}
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
            {therapistsList.map((t) => (
              <option key={t._id} value={t._id}>
                {t.firstName} {t.lastName}
              </option>
            ))}
          </select>
        </div>

        {/* Paciente */}
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
            {patientsList.map((t) => (
              <option key={t._id} value={t._id}>
                {t.firstName} {t.lastName}
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

        {/* Imágenes */}
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

        {/* Botones */}
        <div className="grid sm:grid-cols-2 gap-3">
          <button
            onClick={generateAndUploadPDF}
            disabled={generating}
            className="w-full p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {generating ? "Generando…" : "Generar y Guardar en S3"}
          </button>

          <button
            onClick={generateAndDownloadPDF}
            disabled={generating}
            className="w-full p-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition disabled:opacity-50"
          >
            {generating ? "Generando…" : "Descargar PDF"}
          </button>
        </div>
      </div>

      {/* ====== CONTENIDO DEL PDF ====== */}
      <div ref={pdfRef} className="p-6 mt-8 bg-white border rounded-lg shadow-md">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-gray-800">Reporte de Citas</h1>
          <p className="text-gray-600">Generado el {new Date().toLocaleDateString()}</p>
        </div>

        {/* Información Principal */}
        <div className="mb-6 space-y-1">
          <p>
            <strong>Terapeuta:</strong>{" "}
            {therapistObj ? `${therapistObj.firstName} ${therapistObj.lastName}` : "—"}
          </p>
          <p>
            <strong>Paciente:</strong>{" "}
            {patientObj ? `${patientObj.firstName} ${patientObj.lastName}` : "—"}
          </p>
        </div>

        {/* Notas */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold">Notas</h2>
          <p className="whitespace-pre-wrap">{notes || "No hay notas ingresadas."}</p>
        </div>

        {/* Imágenes */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Imágenes</h2>
          {images.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {images.map((img, index) => (
                <div key={index} className="flex flex-col items-center">
                  <img
                    src={img.url}
                    alt={`uploaded-${index}`}
                    className="w-full max-w-md border border-gray-200 rounded-lg"
                  />
                </div>
              ))}
            </div>
          ) : (
            <p>No hay imágenes subidas.</p>
          )}
        </div>

        {/* Pie */}
        <div className="text-center mt-6 text-xs text-gray-500">
          <p>Este reporte fue generado automáticamente por el sistema.</p>
          <p className="italic">Vista previa del documento.</p>
        </div>
      </div>
    </div>
  );
};

export default Reporte;