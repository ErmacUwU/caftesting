"use client";
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useAuth } from "../context/AuthContext.js";
import { useRouter } from "next/navigation";
import axios from "axios";
import useDebounce from "@/hooks/useDebounce";

const Reporte = () => {
  // -------------------------------------------------------------------------
  // 1. ESTADOS
  // -------------------------------------------------------------------------
  const [selectedTherapist, setSelectedTherapist] = useState("");
  const [selectedPatient, setSelectedPatient] = useState("");
  const [notes, setNotes] = useState("");
  const [images, setImages] = useState([]);
  const [therapistsList, setTherapistsList] = useState([]);
  const [patientsList, setPatientList] = useState([]);
  const [therapistSearch, setTherapistSearch] = useState("");
  const [patientSearch, setPatientSearch] = useState("");
  const [generating, setGenerating] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });

  const pdfRef = useRef();
  const fileInputRef = useRef();
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Helpers para encontrar los objetos seleccionados y mostrar sus nombres
  const therapistObj = therapistsList.find((t) => t._id === selectedTherapist);
  const patientObj = patientsList.find((p) => p._id === selectedPatient);

  const debouncedTherapistSearch = useDebounce(therapistSearch, 300);
  const debouncedPatientSearch = useDebounce(patientSearch, 300);

  const getTherapistName = useCallback(
    (t) => `${t.therapistProfile?.firstName || ""} ${t.therapistProfile?.lastName || ""}`.trim(),
    []
  );
  const getPatientName = useCallback(
    (p) => `${p.patientProfile?.firstName || ""} ${p.patientProfile?.lastName || ""}`.trim(),
    []
  );

  // Orden alfabético por defecto + filtro por la barra de búsqueda (con
  // debounce). El elemento ya seleccionado se mantiene visible aunque no
  // coincida con la búsqueda, para no perder la selección del <select>.
  const visibleTherapistsList = useMemo(
    () =>
      [...therapistsList]
        .sort((a, b) => getTherapistName(a).localeCompare(getTherapistName(b), "es", { sensitivity: "base" }))
        .filter(
          (t) =>
            t._id === selectedTherapist ||
            getTherapistName(t).toLowerCase().includes(debouncedTherapistSearch.trim().toLowerCase())
        ),
    [therapistsList, selectedTherapist, debouncedTherapistSearch, getTherapistName]
  );
  const visiblePatientsList = useMemo(
    () =>
      [...patientsList]
        .sort((a, b) => getPatientName(a).localeCompare(getPatientName(b), "es", { sensitivity: "base" }))
        .filter(
          (p) =>
            p._id === selectedPatient ||
            getPatientName(p).toLowerCase().includes(debouncedPatientSearch.trim().toLowerCase())
        ),
    [patientsList, selectedPatient, debouncedPatientSearch, getPatientName]
  );

  // -------------------------------------------------------------------------
  // 2. SEGURIDAD Y CARGA DE DATOS
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login");
  }, [isAuthenticated, isLoading, router]);

  // --- CARGA DE DATOS CORREGIDA ---
useEffect(() => {
  const fetchUsers = async () => {
    try {
      const [therapistsRes, patientsRes] = await Promise.all([
        axios.get("/api/usuarioTrue?role=therapist"),
        axios.get("/api/usuarioTrue?role=patient"),
      ]);

      // Intentamos extraer los arrays (manejando diferentes estructuras posibles)
      const therapists = therapistsRes.data.users || therapistsRes.data || [];
      const patients = patientsRes.data.users || patientsRes.data || [];

      setTherapistsList(Array.isArray(therapists) ? therapists : []);
      setPatientList(Array.isArray(patients) ? patients : []);

    } catch (error) {
      console.error("Error detallado al cargar usuarios:", error.response || error);
      setStatusMsg({ 
        type: "error", 
        text: "Error de conexión. Revisa la consola (F12)." 
      });
    }
  };

  if (isAuthenticated) fetchUsers();
}, [isAuthenticated]);

  // -------------------------------------------------------------------------
  // 3. MANEJO DE ARCHIVOS (IMÁGENES)
  // -------------------------------------------------------------------------
  const handleImageChange = useCallback((event) => {
    const files = Array.from(event.target.files || []);
    const newImages = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...newImages]);
  }, []);

  const resetInputs = useCallback(() => {
    setSelectedTherapist("");
    setSelectedPatient("");
    setNotes("");
    images.forEach((i) => URL.revokeObjectURL(i.url));
    setImages([]);
    if (fileInputRef.current) fileInputRef.current.value = null;
    setStatusMsg({ type: "success", text: "Reporte procesado y formulario limpio." });
    setTimeout(() => setStatusMsg({ type: "", text: "" }), 5000);
  }, [images]);

  // -------------------------------------------------------------------------
  // 4. LÓGICA DE PDF Y S3
  // -------------------------------------------------------------------------
  const generatePDFBlob = useCallback(async () => {
    const element = pdfRef.current;
    if (!element) throw new Error("Referencia al PDF no encontrada.");

    const options = {
      margin: 0.5,
      filename: "reporte.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
    };

    // Importación dinámica de html2pdf para evitar errores de SSR
    const html2pdfModule = (await import("html2pdf.js")).default;
    const worker = html2pdfModule().from(element).set(options).toPdf();
    const pdf = await worker.get("pdf");
    return pdf.output("blob");
  }, []);

  const handleGenerateAndUpload = useCallback(async () => {
    // 1. Verificación previa
    if (!selectedTherapist || !selectedPatient) {
      alert("Por favor selecciona terapeuta y paciente antes de continuar.");
      return;
    }

    setGenerating(true);
    setStatusMsg({ type: "info", text: "Generando PDF y subiendo a la nube..." });

    try {
      // Definimos el nombre del archivo
      const filename = `Reporte_${patientObj?.patientProfile?.lastName || "Paciente"}_${Date.now()}.pdf`;
      
      // Generamos el binario del PDF
      const pdfBlob = await generatePDFBlob();

      // 2. Obtener URL firmada de S3
      const presign = await axios.post("/api/s3/upload", {
        name: filename,
        type: "application/pdf",
      });

      const uploadUrl = presign.data.url;

      // 3. Subir el archivo real a S3
      await axios.put(uploadUrl, pdfBlob, {
        headers: { "Content-Type": "application/pdf" },
      });

      // 3.5 Subir cada imagen adjunta a S3 (antes se guardaba la URL blob:
      // de la previsualización local, válida solo en esta pestaña — quedaba
      // muerta en cuanto se recargaba la página o se abría el reporte
      // después).
      const uploadedImageUrls = await Promise.all(
        images.map(async ({ file }, idx) => {
          const imgFilename = `${filename.replace(/\.pdf$/, "")}_img${idx + 1}_${file.name}`;
          const imgPresign = await axios.post("/api/s3/upload", {
            name: imgFilename,
            type: file.type,
          });
          await axios.put(imgPresign.data.url, file, {
            headers: { "Content-Type": file.type },
          });
          return imgPresign.data.url.split("?")[0];
        })
      );

      // 4. REGISTRO EN BASE DE DATOS (Aquí estaba el error)
      // Enviamos exactamente los campos que tu API requiere
      const payload = {
        name: filename,
        type: "application/pdf",          // Campo requerido
        size: pdfBlob.size,               // Campo requerido (en bytes)
        url: uploadUrl.split("?")[0],     // URL limpia sin tokens de S3
        patient: selectedPatient,         // ID del UserTrue (paciente)
        therapist: selectedTherapist,     // ID del UserTrue (terapeuta)
        notes: notes,                     // Notas opcionales
        images: uploadedImageUrls,        // URLs reales y persistentes en S3
      };

      const response = await axios.post("/api/reports", payload);

      if (response.status === 201) {
        resetInputs();
        setStatusMsg({ type: "success", text: "¡Reporte guardado correctamente!" });
      }

    } catch (error) {
      console.error("Error detallado:", error.response?.data || error);
      setStatusMsg({
        type: "error",
        text: error.response?.data?.error || "Error al procesar el reporte."
      });
    } finally {
      setGenerating(false);
    }
  }, [selectedTherapist, selectedPatient, patientObj, notes, images, generatePDFBlob, resetInputs]);

  const handleDownloadOnly = useCallback(async () => {
    setGenerating(true);
    try {
      const pdfBlob = await generatePDFBlob();
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Reporte_${patientObj?.patientProfile?.lastName || "Paciente"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert("Error al descargar el PDF.");
    } finally {
      setGenerating(false);
    }
  }, [generatePDFBlob, patientObj]);

  if (isLoading) return <div className="p-10 text-center font-bold text-slate-500">Verificando sesión...</div>;

  // -------------------------------------------------------------------------
  // 5. RENDERIZADO
  // -------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-10">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-black text-slate-800 tracking-tighter uppercase">
            Generador de Reportes
          </h1>
          <p className="text-slate-500">Sistema de documentación clínica UserTrue</p>
        </header>

        {statusMsg.text && (
          <div className={`mb-6 p-4 rounded-lg border-l-4 font-medium ${
            statusMsg.type === "error" ? "bg-red-100 border-red-500 text-red-700" : 
            statusMsg.type === "success" ? "bg-green-100 border-green-500 text-green-700" : 
            "bg-blue-100 border-blue-500 text-blue-700"
          }`}>
            {statusMsg.text}
          </div>
        )}

        <div className="bg-white p-8 rounded-3xl shadow-xl space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Selector Terapeuta */}
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-2">Terapeuta</label>
              <div className="relative mb-2">
                <input
                  type="text"
                  value={therapistSearch}
                  onChange={(e) => setTherapistSearch(e.target.value)}
                  placeholder="Buscar terapeuta..."
                  className="w-full p-2 pl-8 bg-slate-50 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all text-sm"
                />
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                  🔍
                </span>
              </div>
              <select
                value={selectedTherapist}
                onChange={(e) => setSelectedTherapist(e.target.value)}
                className="w-full p-3 bg-slate-50 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all"
              >
                <option value="">Seleccione especialista...</option>
                {visibleTherapistsList.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.therapistProfile?.firstName} {t.therapistProfile?.lastName}
                  </option>
                ))}
              </select>
            </div>

            {/* Selector Paciente */}
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-2">Paciente</label>
              <div className="relative mb-2">
                <input
                  type="text"
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  placeholder="Buscar paciente..."
                  className="w-full p-2 pl-8 bg-slate-50 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all text-sm"
                />
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                  🔍
                </span>
              </div>
              <select
                value={selectedPatient}
                onChange={(e) => setSelectedPatient(e.target.value)}
                className="w-full p-3 bg-slate-50 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all"
              >
                <option value="">Seleccione paciente...</option>
                {visiblePatientsList.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.patientProfile?.firstName} {p.patientProfile?.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-400 uppercase mb-2">Observaciones Clínicas</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows="4"
              className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all"
              placeholder="Describa el progreso o novedades de la sesión..."
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-400 uppercase mb-2">Evidencia fotográfica</label>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            />
          </div>

          <div className="flex flex-col md:flex-row gap-4 pt-4 border-t">
            <button
              onClick={handleGenerateAndUpload}
              disabled={generating}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-200 transition-all disabled:bg-slate-300"
            >
              {generating ? "PROCESANDO..." : "GUARDAR EN SISTEMA (S3)"}
            </button>
            <button
              onClick={handleDownloadOnly}
              disabled={generating}
              className="px-8 bg-slate-800 hover:bg-slate-900 text-white font-bold py-4 rounded-2xl transition-all disabled:opacity-50"
            >
              DESCARGAR PDF
            </button>
          </div>
        </div>

        {/* --- PLANTILLA PDF (HIDDEN/VISIBLE PREVIEW) --- */}
        <div className="mt-12 overflow-hidden rounded-3xl border-2 border-slate-200 bg-white">
          <div className="bg-slate-100 p-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Vista previa del documento a generar
          </div>
          
          <div ref={pdfRef} className="p-12 bg-white text-slate-800">
            {/* Header PDF */}
            <div className="flex justify-between items-start border-b-4 border-blue-600 pb-6 mb-8">
              <div>
                <h2 className="text-3xl font-black text-blue-600 uppercase">Informe de Sesión</h2>
                <p className="text-slate-400 font-bold tracking-tighter">USERTRUE CLINICAL SYSTEMS</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">FECHA: {new Date().toLocaleDateString("es-MX")}</p>
                <p className="text-[10px] text-slate-400">REF: {Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
              </div>
            </div>

            {/* Info Participantes */}
            <div className="grid grid-cols-2 gap-10 mb-10">
              <div className="bg-slate-50 p-4 rounded-xl">
                <p className="text-[10px] font-black text-blue-500 uppercase mb-1">Especialista</p>
                <p className="font-bold text-lg">
                  {therapistObj ? `${therapistObj.therapistProfile?.firstName} ${therapistObj.therapistProfile?.lastName}` : "— No asignado —"}
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl">
                <p className="text-[10px] font-black text-blue-500 uppercase mb-1">Paciente</p>
                <p className="font-bold text-lg">
                  {patientObj ? `${patientObj.patientProfile?.firstName} ${patientObj.patientProfile?.lastName}` : "— No seleccionado —"}
                </p>
              </div>
            </div>

            {/* Notas PDF */}
            <div className="mb-10">
              <h3 className="text-xs font-black text-slate-400 uppercase mb-3 border-b pb-1">Observaciones Clínicas</h3>
              <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap italic">
                {notes || "No se ingresaron notas adicionales para esta sesión."}
              </p>
            </div>

            {/* Imágenes PDF */}
            {images.length > 0 && (
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase mb-4 border-b pb-1">Evidencias Fotográficas</h3>
                <div className="grid grid-cols-2 gap-4">
                  {images.map((img, idx) => (
                    <img 
                      key={idx} 
                      src={img.url} 
                      className="w-full h-48 object-cover rounded-xl border border-slate-100 shadow-sm"
                      alt="evidencia" 
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Footer PDF */}
            <div className="mt-20 pt-10 border-t border-slate-100 flex justify-around">
              
              <div className="text-center text-slate-300 text-[10px] self-end italic">
                Documento generado digitalmente por UserTrue
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reporte;