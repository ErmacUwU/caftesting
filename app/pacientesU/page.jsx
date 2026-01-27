"use client";
import React, { useEffect, useState } from "react";

export default function PaginaPacientes() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [idToDelete, setIdToDelete] = useState(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false); // Nuevo
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null); // Usuario completo a editar
  const [editForm, setEditForm] = useState({}); // Datos temporales del formulario
  // Agrega este estado al inicio de tu componente
  const [successConfig, setSuccessConfig] = useState({ title: "", message: "", icon: "" });
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewData, setViewData] = useState(null);

  useEffect(() => {
    const fetchPacientes = async () => {
      try {
        const res = await fetch("/api/usuarioTrue");
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Error cargando pacientes");
      } finally {
        setLoading(false);
      }
    };
    fetchPacientes();
  }, []);

  const eliminarPaciente = async (id) => {
    try {
      const res = await fetch(`/api/usuarioTrue/${id}`, { method: "DELETE" });
      if (res.ok) {
      // 1. Quitamos al paciente de la lista visualmente
      setData(data.filter(p => p._id !== idToDelete));
      // 2. Cerramos el modal de confirmación
      setIsDeleteModalOpen(false);
      // 3. Abrimos el modal de éxito
      setSuccessConfig({
    title: "¡Borrado Exitoso!",
    message: "El registro del paciente ha sido eliminado permanentemente.",
    icon: "🗑️"
  });
  setIsSuccessModalOpen(true);
    } else {
      alert("Hubo un error al borrar el registro.");
    }
  } catch (error) {
    console.error("Error:", error);
  }
  };

const abrirExpediente = (user) => {
  setViewData(user);
  setIsViewModalOpen(true);
};
 
const abrirEdicion = (user) => {
  setSelectedUser(user);
  // Clonamos todo el perfil del paciente para asegurar que editamos todos los campos
  setEditForm({ ...user.patientProfile }); 
  setIsEditModalOpen(true);
};

// Manejador para los contactos (similar al que usas en el registro)
const handleContactChange = (index, e) => {
  const { name, value } = e.target;
  const updatedContacts = [...editForm.contacts];
  updatedContacts[index][name] = value;
  setEditForm({ ...editForm, contacts: updatedContacts });
};

// Al enviar el formulario de edición
const guardarCambios = async (e) => {
  e.preventDefault();

  // VALIDACIÓN: Verificar que exista al menos un contacto
  if (!editForm.contacts || editForm.contacts.length === 0) {
    alert("❌ Error: Debe haber al menos un contacto de emergencia.");
    return; // Detiene la ejecución
  }

  // VALIDACIÓN EXTRA: Verificar que el primer contacto tenga nombre y teléfono
  const primerContacto = editForm.contacts[0];
  if (!primerContacto.firstName.trim() || !primerContacto.phone.trim()) {
    alert("❌ Error: El primer contacto de emergencia debe tener al menos nombre y teléfono.");
    return;
  }

  // Si pasa las validaciones, procedemos con el envío
  try {
    const res = await fetch(`/api/usuarioTrue/${selectedUser._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientData: editForm }),
    });

    if (res.ok) {
      // ... (tu lógica de éxito que ya teníamos)
      setData(data.map(u => u._id === selectedUser._id 
        ? { ...u, patientProfile: { ...u.patientProfile, ...editForm } } 
        : u
      ));
      setIsEditModalOpen(false);
      setSuccessConfig({
    title: "¡Actualización Exitosa!",
    message: "La información del paciente se ha guardado correctamente.",
    icon: "💾"
  });
  setIsSuccessModalOpen(true);
    }
  } catch (error) {
    alert("Error al conectar con el servidor.");
  }
};

// AGREGAR UN NUEVO CONTACTO VACÍO
const agregarContacto = () => {
  setEditForm({
    ...editForm,
    contacts: [
      ...editForm.contacts,
      { 
        firstName: "", 
        lastName: "",      // Apellido Paterno
        secondLastName: "", // Apellido Materno
        phone: "", 
        email: "", 
        additionalPhone: "",
        street: "",
        houseNumber: "",
        zipCode: "",
        neighborhood: "",
        city: "",
        state: "",
        country: "",
        sendRecordatorios: false
      }
    ]
  });
};

// ELIMINAR UN CONTACTO ESPECÍFICO POR ÍNDICE
const eliminarContacto = (indexABorrar) => {
  const nuevosContactos = editForm.contacts.filter((_, index) => index !== indexABorrar);
  setEditForm({ ...editForm, contacts: nuevosContactos });
};

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-indigo-950">Panel de Pacientes</h1>
            <p className="text-gray-500">Gestión de usuarios registrados con perfil de paciente.</p>
          </div>
          <span className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full font-semibold text-sm">
            {data.length} Registrados
          </span>
        </header>

        {loading ? (
          <div className="flex justify-center p-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="grid gap-6">
            {data.map((user) => {
              const p = user.patientProfile; // Aquí vive la data de PatientU
              return (
                <div key={user._id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="md:flex">
                    {/* Lateral con Nombre e Info Básica */}
                    <div className="p-6 md:w-1/3 bg-indigo-50 border-r border-gray-100">
                      <h2 className="text-xl font-bold text-gray-800 uppercase">
                        {p?.firstName} {p?.lastName}
                      </h2>
                      <p className="text-indigo-600 text-sm font-medium mb-4">{user.email}</p>
                      <div className="space-y-2 text-sm text-gray-600">
                        <p><strong>CURP:</strong> {p?.idType || "No registrado"}</p>
                        <p><strong>Género:</strong> {p?.gender === 'M' ? 'Masculino' : 'Femenino'}</p>
                        <p><strong>Estatus:</strong> 
                          <span className={`ml-2 px-2 py-0.5 rounded text-xs ${p?.patientStatus === 'activo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {p?.patientStatus}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Contenido con Contactos de Emergencia */}
                    <div className="p-6 md:w-2/3">
                      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Contactos de Emergencia</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        {p?.contacts?.map((contact, idx) => (
                          <div key={idx} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <p className="font-semibold text-gray-700">{contact.firstName} {contact.lastName}</p>
                            <p className="text-xs text-gray-500 italic">{contact.city}, {contact.state}</p>
                            <div className="mt-2 flex items-center text-indigo-600 font-medium text-sm">
                              <span>📞 {contact.phone}</span>
                            </div>
                          </div>
                        ))}
                        {(!p?.contacts || p?.contacts.length === 0) && (
                          <p className="text-gray-400 text-sm italic">Sin contactos registrados.</p>
                        )}
                      </div>
                      
                      <div className="mt-6 pt-4 border-t flex justify-end">
                        <button className="text-indigo-600 hover:text-indigo-800 text-sm font-bold transition"
                        onClick={() => abrirExpediente(user)}>
                          VER EXPEDIENTE COMPLETO → 
                        </button>

                        {/* BOTÓN BORRAR */}
                        <div className="flex space-x-3">
                        <button 
                        onClick={() => {
                            setIdToDelete(user._id); // Guardamos el ID
                            setIsDeleteModalOpen(true); // Abrimos el modal
                            }}
                            className="bg-red-100 text-red-700 p-2 rounded-lg hover:bg-red-200 transition">
                                🗑️ Borrar
                        </button>

                        {/* BOTÓN EDITAR */}
                        <button 
                            onClick={() => abrirEdicion(user)} // Llamamos a la función con los datos del usuario actual
                            className="flex items-center bg-amber-50 text-amber-700 px-4 py-2 rounded-xl hover:bg-amber-100 border border-amber-200 transition-all shadow-sm"
                        >
                            <span className="text-lg">✏️</span>
                            <span className="ml-2 font-semibold hidden md:inline">Editar</span>
                        </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
        {/* MODAL DE CONFIRMACIÓN */}
        {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl transform transition-all scale-100">
            <div className="text-center">
                {/* Icono de advertencia */}
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <span className="text-red-600 text-3xl">⚠️</span>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-2">¿Confirmar eliminación?</h3>
                <p className="text-gray-500 mb-6">
                Esta acción eliminará permanentemente al paciente y su acceso al sistema. No se puede deshacer.
                </p>
                
                <div className="flex space-x-3">
                <button
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
                >
                    Cancelar
                </button>
                <button
                    onClick={() => {
                    eliminarPaciente(idToDelete);
                    setIsDeleteModalOpen(false);
                    }}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium shadow-lg shadow-red-200"
                >
                    Sí, Eliminar
                </button>
                </div>
            </div>
            </div>
        </div>
        )}

        {/* VENTANA DE ÉXITO */}
        {isSuccessModalOpen && (
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fadeIn">
    <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center border-t-4 border-emerald-500">
      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 mb-4">
        <span className="text-3xl">{successConfig.icon}</span>
      </div>
      
      <h3 className="text-xl font-bold text-gray-900 mb-2">{successConfig.title}</h3>
      <p className="text-gray-500 mb-6">{successConfig.message}</p>
      
      <button
        onClick={() => setIsSuccessModalOpen(false)}
        className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-bold shadow-lg shadow-emerald-200"
      >
        Entendido
      </button>
    </div>
  </div>
)}

{isViewModalOpen && viewData && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-fadeIn">
      
      {/* Header */}
      <div className="bg-slate-800 p-6 text-white flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold uppercase tracking-wider">Expediente Clínico Digital</h3>
          <p className="text-slate-400 text-sm">ID Paciente: {viewData._id}</p>
        </div>
        <button onClick={() => setIsViewModalOpen(false)} className="text-3xl hover:text-red-400">&times;</button>
      </div>

      {/* Contenido con Scroll */}
      <div className="p-8 overflow-y-auto space-y-8 bg-gray-50">
        
        {/* SECCIÓN: DATOS PERSONALES */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h4 className="text-blue-600 font-black uppercase text-xs mb-4 border-b pb-2">Información del Paciente</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-bold">Nombre Completo</p>
              <p className="font-semibold text-gray-800">{viewData.patientProfile?.firstName} {viewData.patientProfile?.lastName}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-bold">CURP</p>
              <p className="font-semibold text-gray-800">{viewData.patientProfile?.idType || 'N/A'}</p>
            </div>
            <div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-bold">Email</p>
              <p className="font-semibold text-gray-800">{viewData.email || 'N/A'}</p>
            </div>
            <div></div>
              <p className="text-[10px] text-gray-400 uppercase font-bold">Estatus</p>
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-bold uppercase">
                {viewData.patientProfile?.patientStatus || 'Activo'}
              </span>
            </div>
          </div>
        </section>

        {/* SECCIÓN: CONTACTOS DE EMERGENCIA (Basado en tu imagen) */}
        <section>
          <h4 className="text-blue-600 font-black uppercase text-xs mb-4">Contactos de Emergencia ({viewData.patientProfile?.contacts?.length})</h4>
          <div className="grid md:grid-cols-2 gap-4">
            {viewData.patientProfile?.contacts?.map((contact, idx) => (
              <div key={idx} className="bg-white p-5 rounded-xl border-l-4 border-blue-500 shadow-sm">
                <div className="flex justify-between mb-3">
                  <p className="font-bold text-gray-700">{contact.firstName} {contact.lastName} {contact.secondLastName}</p>
                  <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded-md font-bold uppercase">{contact.relationship}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                  <p className="text-gray-500">📞 {contact.phone}</p>
                  <p className="text-gray-500">📧 {contact.email || 'Sin correo'}</p>
                </div>

                <div className="text-xs text-gray-400 bg-gray-50 p-2 rounded">
                  <p className="font-bold uppercase mb-1 text-[9px]">Dirección:</p>
                  <p>{contact.street} #{contact.houseNumber}, Col. {contact.neighborhood}</p>
                  <p>{contact.city}, {contact.state}, CP: {contact.zipCode}</p>
                </div>

                {contact.sendRecordatorios && (
                  <p className="mt-3 text-[10px] text-emerald-600 font-bold flex items-center">
                    ✅ Recibe recordatorios
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

      </div>

      {/* Footer del Modal */}
      <div className="p-4 bg-gray-100 border-t flex justify-end">
        <button 
          onClick={() => {
            setIsViewModalOpen(false);
            abrirEdicion(viewData); // Saltamos directo a editar si detectamos error
          }} 
          className="mr-3 px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700"
        >
          Editar Datos
        </button>
        <button 
          onClick={() => setIsViewModalOpen(false)} 
          className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-400"
        >
          Cerrar
        </button>
      </div>

    </div>
  </div>
)}

        {isEditModalOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-fadeIn">
      
      {/* Header Fijo */}
      <div className="sticky top-0 bg-indigo-700 p-6 text-white flex justify-between items-center z-10">
        <div>
          <h3 className="text-2xl font-bold">Edición Integral de Paciente</h3>
          <p className="text-indigo-100 opacity-80">Modificando perfil de {editForm.firstName}</p>
        </div>
        <button onClick={() => setIsEditModalOpen(false)} className="text-white text-2xl">&times;</button>
      </div>

      <form onSubmit={guardarCambios} className="p-8 space-y-8">
        
        {/* SECCIÓN 1: DATOS PERSONALES */}
        <section>
          <h4 className="text-indigo-600 font-bold border-b pb-2 mb-4">1. Identificación y Estado</h4>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-500">Nombre</label>
              <input type="text" className="w-full p-2 border rounded" value={editForm.firstName} onChange={(e) => setEditForm({...editForm, firstName: e.target.value})} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500">Apellidos</label>
              <input type="text" className="w-full p-2 border rounded" value={editForm.lastName} onChange={(e) => setEditForm({...editForm, lastName: e.target.value})} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500">CURP</label>
              <input type="text" className="w-full p-2 border rounded uppercase" value={editForm.idType} onChange={(e) => setEditForm({...editForm, idType: e.target.value})} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500">Estado del Paciente</label>
              <select className="w-full p-2 border rounded" value={editForm.patientStatus} onChange={(e) => setEditForm({...editForm, patientStatus: e.target.value})}>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500">Género</label>
              <select className="w-full p-2 border rounded" value={editForm.gender} onChange={(e) => setEditForm({...editForm, gender: e.target.value})}>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
              </select>
            </div>
          </div>
        </section>

        {/* SECCIÓN 2: LUGAR Y FECHA */}
        <section>
          <h4 className="text-indigo-600 font-bold border-b pb-2 mb-4">2. Nacimiento y Nacionalidad</h4>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-gray-500">Ciudad de Nacimiento</label>
              <input type="text" className="w-full p-2 border rounded" value={editForm.birthCity} onChange={(e) => setEditForm({...editForm, birthCity: e.target.value})} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500">Estado</label>
              <input type="text" className="w-full p-2 border rounded" value={editForm.birthState} onChange={(e) => setEditForm({...editForm, birthState: e.target.value})} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500">Nacionalidad</label>
              <input type="text" className="w-full p-2 border rounded" value={editForm.nationality} onChange={(e) => setEditForm({...editForm, nationality: e.target.value})} />
            </div>
          </div>
        </section>

        {/* SECCIÓN 3: CONTACTOS DE EMERGENCIA */}
        {/* SECCIÓN 3: CONTACTOS DE EMERGENCIA */}
<section className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
  <div className="flex justify-between items-center mb-6">
    <h4 className="text-indigo-600 font-bold flex items-center">
      <span className="mr-2">🚨</span> 3. Contactos de Emergencia
    </h4>
    <button
      type="button"
      onClick={agregarContacto}
      className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition flex items-center shadow-sm"
    >
      + Añadir Contacto
    </button>
  </div>

  <div className="space-y-4">
    {editForm.contacts?.map((contact, index) => (
  <div key={index} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative mb-6">
    <div className="flex justify-between items-center mb-4">
      <p className="font-bold text-indigo-900">Contacto #{index + 1}</p>
      <button type="button" onClick={() => eliminarContacto(index)} className="text-red-400 hover:text-red-600">Eliminar</button>
    </div>
    
    {/* FILA 1: NOMBRES */}
    <div className="grid md:grid-cols-3 gap-4 mb-4">
      <div>
        <label className="block text-xs text-gray-500 mb-1">Nombre *</label>
        <input type="text" className="w-full p-2 bg-blue-50/50 border border-blue-100 rounded-lg" value={contact.firstName} onChange={(e) => handleContactChange(index, {target: {name: 'firstName', value: e.target.value}})} />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Apellido P. *</label>
        <input type="text" className="w-full p-2 bg-blue-50/50 border border-blue-100 rounded-lg" value={contact.lastName} onChange={(e) => handleContactChange(index, {target: {name: 'lastName', value: e.target.value}})} />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Apellido M.</label>
        <input type="text" className="w-full p-2 bg-blue-50/50 border border-blue-100 rounded-lg" value={contact.secondLastName} onChange={(e) => handleContactChange(index, {target: {name: 'secondLastName', value: e.target.value}})} />
      </div>
    </div>

    {/* FILA 2: CONTACTO */}
    <div className="grid md:grid-cols-3 gap-4 mb-4">
      <div>
        <label className="block text-xs text-gray-500 mb-1">Teléfono *</label>
        <input type="text" className="w-full p-2 bg-blue-50/50 border border-blue-100 rounded-lg" value={contact.phone} onChange={(e) => handleContactChange(index, {target: {name: 'phone', value: e.target.value}})} />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Email</label>
        <input type="email" className="w-full p-2 bg-blue-50/50 border border-blue-100 rounded-lg" value={contact.email} onChange={(e) => handleContactChange(index, {target: {name: 'email', value: e.target.value}})} />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Tel. Adicional</label>
        <input type="text" className="w-full p-2 bg-blue-50/50 border border-blue-100 rounded-lg" value={contact.additionalPhone} onChange={(e) => handleContactChange(index, {target: {name: 'additionalPhone', value: e.target.value}})} />
      </div>
    </div>

    {/* FILA 3: DIRECCIÓN (Línea superior) */}
    <div className="grid grid-cols-12 gap-2 mb-2">
      <input placeholder="Calle/Avenida" className="col-span-6 p-2 bg-blue-50/50 border border-blue-100 rounded-lg text-sm" value={contact.street} onChange={(e) => handleContactChange(index, {target: {name: 'street', value: e.target.value}})} />
      <input placeholder="N. Exterior" className="col-span-2 p-2 bg-blue-50/50 border border-blue-100 rounded-lg text-sm" value={contact.houseNumber} onChange={(e) => handleContactChange(index, {target: {name: 'houseNumber', value: e.target.value}})} />
      <input placeholder="C.P." className="col-span-4 p-2 bg-blue-50/50 border border-blue-100 rounded-lg text-sm" value={contact.zipCode} onChange={(e) => handleContactChange(index, {target: {name: 'zipCode', value: e.target.value}})} />
    </div>

    {/* FILA 4: DIRECCIÓN (Línea inferior) */}
    <div className="grid grid-cols-4 gap-2 mb-4">
      <input placeholder="Colonia" className="p-2 bg-blue-50/50 border border-blue-100 rounded-lg text-sm" value={contact.neighborhood} onChange={(e) => handleContactChange(index, {target: {name: 'neighborhood', value: e.target.value}})} />
      <input placeholder="Ciudad" className="p-2 bg-blue-50/50 border border-blue-100 rounded-lg text-sm" value={contact.city} onChange={(e) => handleContactChange(index, {target: {name: 'city', value: e.target.value}})} />
      <input placeholder="Estado" className="p-2 bg-blue-50/50 border border-blue-100 rounded-lg text-sm" value={contact.state} onChange={(e) => handleContactChange(index, {target: {name: 'state', value: e.target.value}})} />
      <input placeholder="País" className="p-2 bg-blue-50/50 border border-blue-100 rounded-lg text-sm" value={contact.country} onChange={(e) => handleContactChange(index, {target: {name: 'country', value: e.target.value}})} />
    </div>

    {/* CHECKBOX RECORDATORIOS */}
    <div className="flex items-center space-x-2">
      <input 
        type="checkbox" 
        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
        checked={contact.sendRecordatorios} 
        onChange={(e) => handleContactChange(index, {target: {name: 'sendRecordatorios', value: e.target.checked}})} 
      />
      <span className="text-sm text-gray-600 font-medium">Enviar recordatorios a este contacto</span>
    </div>
  </div>
))}

    {editForm.contacts?.length === 0 && (
      <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
        <p className="text-gray-400 text-sm">No hay contactos de emergencia registrados.</p>
      </div>
    )}
  </div>
</section>

        {/* Footer con Botones */}
        <div className="flex justify-end space-x-4 sticky bottom-0 bg-white pt-4 border-t">
          <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-6 py-2 text-gray-500 font-bold">Cancelar</button>
<button
  type="submit"
  disabled={!editForm.contacts || editForm.contacts.length === 0}
  className={`px-10 py-2 font-bold rounded-lg shadow-lg transition ${
    !editForm.contacts || editForm.contacts.length === 0
      ? "bg-gray-400 cursor-not-allowed" // Estilo deshabilitado
      : "bg-green-600 text-white hover:bg-green-700 shadow-green-200" // Estilo activo
  }`}
>
  Actualizar Todo
</button>
        </div>
      </form>
    </div>
  </div>
)}
    </div>
  );
}

