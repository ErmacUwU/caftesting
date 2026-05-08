"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext.js"; 
import { useRouter } from "next/navigation";
import axios from "axios";

const ConsultaDocumentos = () => {
  // --- ESTADOS DE DATOS ---
  const [patients, setPatients] = useState([]); 
  const [therapists, setTherapists] = useState([]); 
  const [documents, setDocuments] = useState([]); 
  
  // --- ESTADOS DE CONTROL ---
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [loadingDocuments, setLoadingDocuments] = useState(false); 
  const [selectedPatients, setSelectedPatients] = useState([]); 
  const [selectedTherapists, setSelectedTherapists] = useState([]); 
  const [errorMessage, setErrorMessage] = useState(""); 

  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // --- 1. FUNCIÓN PARA OBTENER REPORTES ---
  // Si se llama sin filtros, el backend debe estar preparado para devolver todo.
  const fetchDocuments = useCallback(async (isInitial = false) => {
    setLoadingDocuments(true);
    setErrorMessage("");
    try {
      const payload = isInitial 
        ? { patients: [], therapists: [] } 
        : { patients: selectedPatients, therapists: selectedTherapists };

        console.log("👀 PAYLOAD ENVIADO AL BACKEND:", payload); // <-- AÑADE ESTO



      const response = await axios.post("/api/s3/documents", payload);
      const docs = response.data.documents || [];
      setDocuments(docs);

      if (docs.length === 0 && !isInitial) {
        setErrorMessage("No se encontraron documentos con esos criterios.");
      }
    } catch (error) {
      console.error("Error al obtener documentos:", error);
      setErrorMessage("Error de conexión con el servidor de reportes.");
    } finally {
      setLoadingDocuments(false);
    }
  }, [selectedPatients, selectedTherapists]);

  // --- 2. CARGA DE FILTROS (PACIENTES/TERAPEUTAS) ---
  const fetchFilters = async () => {
    try {
      setLoadingFilters(true);
      const [tRes, pRes] = await Promise.all([
        axios.get("/api/usuarioTrue?role=therapist"),
        axios.get("/api/usuarioTrue?role=patient")
      ]);

      setTherapists(tRes.data?.users || tRes.data || []);
      setPatients(pRes.data?.users || pRes.data || []);
    } catch (error) {
      console.error("Error al cargar filtros:", error);
    } finally {
      setLoadingFilters(false);
    }
  };

  // --- 3. EFECTO DE ARRANQUE ---
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace('/login');
      } else {
        fetchFilters();
        fetchDocuments(true); // Carga inicial automática de todos los registros
      }
    }
  }, [isAuthenticated, isLoading, router, fetchDocuments]);

  // --- 4. MANEJADORES DE SELECCIÓN ---
  const toggleSelection = (id, type) => {
    const setter = type === 'p' ? setSelectedPatients : setSelectedTherapists;
    setter(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  if (isLoading) return <div className="p-20 text-center font-black text-slate-300 animate-pulse uppercase tracking-widest">Verificando Credenciales...</div>;
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-10">
      <div className="max-w-7xl mx-auto">
        
        {/* CABECERA */}
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">
              Expediente <span className="text-blue-600">Digital</span>
            </h1>
            <p className="text-slate-500 font-bold text-xs mt-2 uppercase tracking-widest">Gestión y consulta de historial clínico</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-black text-slate-400 uppercase">Total de archivos:</span>
            <span className="ml-2 text-sm font-black text-blue-600">{documents.length}</span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          
          {/* PANEL LATERAL DE FILTROS */}
          <aside className="lg:col-span-1 space-y-6">
            
            {/* Filtro Pacientes */}
            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-200">
              <h2 className="text-[11px] font-black text-blue-600 uppercase mb-5 tracking-[0.2em]">Pacientes</h2>
              <div className="space-y-1 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {loadingFilters ? <div className="text-xs italic text-slate-400">Cargando...</div> : 
                  patients.map(p => (
                    <label key={p._id} className={`flex items-center p-3 rounded-2xl cursor-pointer transition-all ${selectedPatients.includes(p._id) ? 'bg-blue-50 border-blue-100' : 'hover:bg-slate-50'}`}>
                      <input 
                        type="checkbox" 
                        className="hidden" 
                        onChange={() => toggleSelection(p._id, 'p')}
                        checked={selectedPatients.includes(p._id)}
                      />
                      <div className={`w-4 h-4 rounded-md border-2 mr-3 flex items-center justify-center transition-all ${selectedPatients.includes(p._id) ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                        {selectedPatients.includes(p._id) && <div className="w-2 h-2 bg-white rounded-full"></div>}
                      </div>
                      <span className="text-[11px] font-black text-slate-700 uppercase tracking-tighter">
                        {p.patientProfile?.firstName} {p.patientProfile?.lastName}
                      </span>
                    </label>
                  ))
                }
              </div>
            </div>

            {/* Filtro Terapeutas */}
            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-200">
              <h2 className="text-[11px] font-black text-blue-600 uppercase mb-5 tracking-[0.2em]">Especialistas</h2>
              <div className="space-y-1 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {loadingFilters ? <div className="text-xs italic text-slate-400">Cargando...</div> : 
                  therapists.map(t => (
                    <label key={t._id} className={`flex items-center p-3 rounded-2xl cursor-pointer transition-all ${selectedTherapists.includes(t._id) ? 'bg-blue-50 border-blue-100' : 'hover:bg-slate-50'}`}>
                      <input 
                        type="checkbox" 
                        className="hidden" 
                        onChange={() => toggleSelection(t._id, 't')}
                        checked={selectedTherapists.includes(t._id)}
                      />
                      <div className={`w-4 h-4 rounded-md border-2 mr-3 flex items-center justify-center transition-all ${selectedTherapists.includes(t._id) ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                        {selectedTherapists.includes(t._id) && <div className="w-2 h-2 bg-white rounded-full"></div>}
                      </div>
                      <span className="text-[11px] font-black text-slate-700 uppercase tracking-tighter">
                        {t.therapistProfile?.firstName} {t.therapistProfile?.lastName}
                      </span>
                    </label>
                  ))
                }
              </div>
            </div>

            <button
              onClick={() => fetchDocuments(false)}
              disabled={loadingDocuments}
              className="w-full bg-slate-900 hover:bg-black text-white font-black py-5 rounded-[24px] shadow-2xl shadow-slate-200 transition-all active:scale-95 disabled:bg-slate-300 uppercase text-xs tracking-widest"
            >
              {loadingDocuments ? "Procesando..." : "Filtrar Resultados"}
            </button>
          </aside>

          {/* LISTADO DE RESULTADOS */}
          <main className="lg:col-span-3">
            {errorMessage && (
              <div className="mb-8 p-5 bg-red-50 text-red-600 rounded-3xl text-xs font-black border border-red-100 uppercase tracking-widest animate-bounce">
                {errorMessage}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {documents.length > 0 ? (
                documents.map((doc) => (
                  <div key={doc._id} className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 hover:border-blue-300 hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-12 -mt-12 transition-all group-hover:bg-blue-600 group-hover:scale-150 duration-500"></div>
                    
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-6">
                        <div className="bg-slate-50 text-slate-400 p-3 rounded-2xl group-hover:bg-white group-hover:text-blue-600 transition-colors">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        </div>
                        <span className="text-[10px] font-black text-slate-300 uppercase group-hover:text-white transition-colors">
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <h3 className="text-slate-800 font-black text-lg uppercase leading-tight mb-6 pr-10 group-hover:text-blue-600 transition-colors">
                        {doc.name}
                      </h3>

                      <div className="space-y-2 mb-8 border-l-2 border-slate-100 pl-4">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Paciente</span>
                          <span className="text-xs font-black text-slate-700 uppercase">{doc.patientName || "No asignado"}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Especialista</span>
                          <span className="text-xs font-black text-slate-700 uppercase">{doc.therapistName || "No asignado"}</span>
                        </div>
                      </div>

                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center w-full bg-slate-900 group-hover:bg-blue-600 text-white font-black py-4 rounded-2xl transition-all text-[10px] uppercase tracking-[0.2em]"
                      >
                        Abrir Documento
                      </a>
                    </div>
                  </div>
                ))
              ) : (
                !loadingDocuments && (
                  <div className="col-span-full py-32 text-center bg-white rounded-[50px] border-4 border-dashed border-slate-100">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg className="w-8 h-8 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                    </div>
                    <p className="text-slate-300 font-black text-xs uppercase tracking-widest">El archivo está vacío</p>
                  </div>
                )
              )}
              {loadingDocuments && <div className="col-span-full text-center py-20 font-black text-blue-600 animate-pulse text-xs uppercase tracking-[0.3em]">Sincronizando Base de Datos...</div>}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default ConsultaDocumentos;