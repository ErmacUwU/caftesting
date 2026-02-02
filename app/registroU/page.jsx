"use client";

import React, { useState, useEffect } from "react";
import uniquid from "uniquid";

// Expresión regular para validar el CURP
const curpPattern = /^[a-zA-Z0-9]{18}$/;

export default function RegistroUsuario() {
  const [role, setRole] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false); // Añade esto junto a tus otros useState

  // --- NUEVOS ESTADOS ---
  const [users, setUsers] = useState([]); // Lista total
  const [filterRole, setFilterRole] = useState("all"); // Filtro de vista
  const [isEditing, setIsEditing] = useState(null); // ID del usuario editando
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [isEditTherapistModalOpen, setIsEditTherapistModalOpen] = useState(false);
  const [isEditAdminModalOpen, setIsEditAdminModalOpen] = useState(false);

useEffect(() => {
  fetchUsers();
}, [filterRole]); // Se ejecuta cada vez que el usuario cambia de pestaña de rol

const fetchUsers = async () => {
  setLoading(true);
  try {
    // Usamos tu endpoint exacto
    const res = await fetch(`/api/usuarioTrue?role=${filterRole}`);
    const data = await res.json();
    
    // Si tu API devuelve directamente el array (como en el GET que mostraste),
    // o si lo devuelve dentro de un objeto { users: [...] }
    const listaUsuarios = Array.isArray(data) ? data : (data.users || []);
    setUsers(listaUsuarios);
  } catch (err) {
    console.error(err);
    setError("Error al conectar con la base de datos");
  } finally {
    setLoading(false);
  }
};

// 2. Función para extraer el nombre independientemente del rol
const getDisplayName = (user) => {
  if (user.patientProfile) return `${user.patientProfile.firstName} ${user.patientProfile.lastName}`;
  if (user.therapistProfile) return `${user.therapistProfile.firstName} ${user.therapistProfile.lastName}`;
  return user.email; // Fallback
};

const handleEditClick = (user) => {
  // 1. Identificamos si tiene perfil o es solo usuario base
  const hasProfile = user.role === 'patient' || user.role === 'therapist';
  const profile = user.role === 'patient' ? user.patientProfile : user.therapistProfile;
  
  setEditForm({
    _id: user._id, 
    role: user.role,
    email: user.email,
    password: "", 
    // Si tiene perfil, cargamos sus datos, si no, solo los base
    ...(hasProfile ? (profile || {}) : {})
  });

  // 2. Abrir el modal según el rol
  if (user.role === 'patient') setIsEditModalOpen(true);
  else if (user.role === 'therapist') setIsEditTherapistModalOpen(true);
  else setIsEditAdminModalOpen(true); // Para admin y operador
};

const guardarCambios = async (e) => {
  e.preventDefault();
  setLoading(true);

  const { _id, email, password, role } = editForm;
  const isStaff = role === 'admin' || role === 'operador';

  try {
    // 1. Siempre actualizamos la cuenta base (Email/Password/Rol)
    const resAcc = await fetch(`/api/usuarioTrue/${_id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role, isAccountUpdate: true }),
    });

    // 2. Solo actualizamos perfil si NO es staff
    let resProf = { ok: true }; 
    if (!isStaff) {
      const profileId = role === 'patient' ? editForm.patientProfile : editForm.therapistProfile;
      resProf = await fetch(`/api/usuarioTrue/${profileId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, profileData: editForm, isProfileUpdate: true }),
      });
    }

    if (resAcc.ok && resProf.ok) {
      alert("¡Cambios guardados con éxito! ✅");
      setIsEditModalOpen(false);
      setIsEditTherapistModalOpen(false);
      setIsEditAdminModalOpen(false);
      fetchUsers();
    }
  } catch (error) {
    alert("Error de conexión");
  } finally {
    setLoading(false);
  }
};



  // Estado unificado (incluye campos de Auth, Paciente, Terapeuta y Contactos)
  const [form, setForm] = useState({
    // Auth
    email: "",
    password: "",
    
    // Datos Comunes / Paciente / Terapeuta
    firstName: "",
    lastName: "",
    phone: "", // Usado en Terapeuta y como backup
    
    // Campos Específicos Paciente
    birthdate: "",
    gender: "",
    patientStatus: "activo",
    birthCity: "",
    nationality: "",
    birthState: "",
    idType: "", // CURP
    consent: false,
    contacts: [
      {
        firstName: "",
        lastName: "",
        middleName: "",
        phone: "",
        email: "",
        additionalPhone: "",
        sendReminders: false,
        street: "",
        number: "",
        postalCode: "",
        neighborhood: "",
        city: "",
        state: "",
        country: "",
      },
    ],

    // Campos Específicos Terapeuta
    specialization: "",
    address: "",
    city: "",
    country: "",
  });

  const resetForm = () => {
  setForm({
    email: "", password: "", firstName: "", lastName: "", phone: "",
    birthdate: "", gender: "", patientStatus: "activo", birthCity: "",
    nationality: "", birthState: "", idType: "", consent: false,
    contacts: [{ firstName: "", lastName: "", middleName: "", phone: "", email: "", additionalPhone: "", sendReminders: false, street: "", number: "", postalCode: "", neighborhood: "", city: "", state: "", country: "" }],
    specialization: "", address: "", city: "", country: ""
  });
  setStep(1);
  setRole("");
};

  // Manejador genérico para inputs simples
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ 
      ...form, 
      [name]: type === "checkbox" ? checked : value 
    });
  };

  // --- LÓGICA DE CONTACTOS (Migrada de RegistroPaciente) ---
  const addContact = () => {
    setForm({
      ...form,
      contacts: [
        ...form.contacts,
        {
          firstName: "", lastName: "", middleName: "", phone: "", email: "",
          additionalPhone: "", sendReminders: false, street: "", number: "",
          postalCode: "", neighborhood: "", city: "", state: "", country: "",
        },
      ],
    });
  };

  const removeContact = (index) => {
    const updatedContacts = [...form.contacts];
    updatedContacts.splice(index, 1);
    setForm({ ...form, contacts: updatedContacts });
  };

  const handleContactChange = (index, event) => {
    const { name, value, type, checked } = event.target;
    const updatedContacts = [...form.contacts];
    if (type === "checkbox") {
      updatedContacts[index][name] = checked;
    } else {
      updatedContacts[index][name] = value;
    }
    setForm({ ...form, contacts: updatedContacts });
  };

  const validateCURP = (curp) => {
    return curpPattern.test(curp);
  };

  // --- SUBMIT ---
  // --- SUBMIT ---
const submit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError(""); // Limpiamos errores previos
  setMsg("");   // Limpiamos mensajes previos

  // 1. Definimos el destino (Siempre es creación)
  const url = "/api/usuarioTrue";
  const method = "POST";

  // 2. Construir el objeto (Payload)
  const payload = {
    email: form.email,
    password: form.password, // En registro nuevo, el password suele ser obligatorio
    role: role,
  };


  // Empaquetamos los datos según el rol seleccionado
  if (role === "patient") {
    payload.patientData = { ...form }; 
  } else if (role === "therapist") {
    payload.therapistData = { ...form };
  } else if (role === "admin" || role === "operador") {
    // Si son admins u operadores, podrías enviar datos adicionales aquí si los hubiera
    payload.adminData = { ...form };
  }

  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (res.ok) {
      setMsg("¡Usuario registrado con éxito! ✅");
      
      // Esperamos un poco para que el usuario vea el mensaje de éxito antes de cerrar
      setTimeout(() => {
        resetForm();      // Limpia todos los inputs
        setShowForm(false); // Cierra el modal de registro
        fetchUsers();     // Refresca la tabla para ver al nuevo usuario
      }, 1500);
    } else {
      setError(data.error || "No se pudo completar el registro");
    }
  } catch (err) {
    console.error("Error al registrar:", err);
    setError("Error de conexión con el servidor");
  } finally {
    setLoading(false);
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

const eliminarUsuario = async (user) => {
  if (!confirm(`¿Estás seguro de eliminar a ${getDisplayName(user)}? Esta acción no se puede deshacer.`)) {
    return;
  }

  try {
    // Identificamos el ID del perfil si existe
    const profileId = user.role === 'patient' 
      ? user.patientProfile?._id || user.patientProfile 
      : user.therapistProfile?._id || user.therapistProfile;

    const response = await fetch(`/api/usuarioTrue/${user._id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        role: user.role, 
        profileId: profileId 
      }),
    });

    if (response.ok) {
      alert("Usuario eliminado correctamente ✅");
      fetchUsers(); // Recarga la tabla para reflejar el cambio
    } else {
      const error = await response.json();
      alert(`Error: ${error.error}`);
    }
  } catch (error) {
    alert("Error al intentar conectar con el servidor");
  }
};


  // Filtrado de la lista
  const filteredUsers = users.filter(u => filterRole === "all" || u.role === filterRole);

  // --- NAVEGACIÓN DE PASOS ---
  const handleNextStep = () => setStep(step + 1);
  const handlePrevStep = () => setStep(step - 1);

  // Clases CSS reutilizables para mantener el estilo limpio
  const inputClass = "w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none text-gray-700";
  const labelClass = "block text-sm font-medium text-gray-600 mb-1";
  const sectionTitleClass = "text-xl font-semibold text-gray-800 border-b pb-2 mb-4";

  return (
<div className="min-h-screen bg-gray-50 flex flex-col items-center p-6">
      
      {/* CABECERA */}
      <div className="w-full max-w-6xl flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-indigo-900">Panel de Usuarios</h1>
          <p className="text-gray-500">Administra pacientes, terapeutas y personal.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setShowForm(true); }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-transform hover:scale-105"
        >
          + Nuevo Registro
        </button>
      </div>

      {/* FILTROS Y TABLA */}
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex gap-2">
    {["all", "patient", "therapist", "admin", "operador"].map((r) => {
      // Objeto de traducción
      const labels = {
        all: "Todos",
        patient: "Pacientes",
        therapist: "Terapeutas",
        admin: "Administradores",
        operador: "Operadores"
      };

      return (
        <button
          key={r}
          onClick={() => setFilterRole(r)} // Sigue usando el valor original (inglés/técnico)
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filterRole === r ? "bg-indigo-600 text-white" : "bg-white text-gray-600 hover:bg-gray-100"
          }`}
        >
          {/* Muestra la traducción o el valor original capitalizado como respaldo */}
          {labels[r] || r.charAt(0).toUpperCase() + r.slice(1)}
        </button>
      );
    })}
  </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Nombre / Email</th>
                <th className="px-6 py-4">Rol</th>
                <th className="px-6 py-4">Estatus/Especialidad</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((user) => {
  // Objeto de mapeo para los roles
  const roleLabels = {
    patient: "Paciente",
    therapist: "Terapeuta",
    admin: "Administrador",
    operador: "Operador"
  };

  return (
    <tr key={user.id || user._id} className="hover:bg-indigo-50/30 transition">
      <td className="px-6 py-4">
        <div className="font-bold text-gray-800">{getDisplayName(user)}</div>
        <div className="text-xs text-gray-500">{user.email}</div>
      </td>
      
      {/* CELDA DE ROL TRADUCIDA */}
      <td className="px-6 py-4">
  <span className={`px-2 py-1 rounded-full text-xs font-bold ${{patient:'bg-blue-100 text-blue-700', therapist:'bg-purple-100 text-purple-700', admin:'bg-red-100 text-red-700', operador:'bg-amber-100 text-amber-700'}[user.role] || 'bg-gray-100 text-gray-700'}`}>
    {{patient:'Paciente', therapist:'Terapeuta', admin:'Administrador', operador:'Operador'}[user.role] || user.role}
  </span>
</td>

      <td className="px-6 py-4 text-sm text-gray-600">
                  {user.role === 'patient' ? (user.patientProfile?.patientStatus || 'Activo') 
                  : (user.therapistProfile?.specialization || 'General')}
                  </td>

     <td className="px-6 py-4 text-center flex justify-center gap-3">
  <button 
    onClick={() => handleEditClick(user)}
    className="text-indigo-600 hover:text-indigo-900 font-semibold text-sm"
  >
    Editar
  </button>
  <button 
    onClick={() => eliminarUsuario(user)}
    className="text-red-600 hover:text-red-900 font-semibold text-sm"
  >
    Borrar
  </button>
</td>
    </tr>
  );
})}
            </tbody>
          </table>
          {filteredUsers.length === 0 && (
            <div className="p-10 text-center text-gray-400">No se encontraron usuarios con este rol.</div>
          )}
        </div>
      </div>

      {/* MODAL (Reutilizando tu estructura original) */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowForm(false)}></div>
          <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-2xl font-bold text-indigo-900">
                {isEditing ? `Editando: ${form.firstName}` : "Registro de Usuario"}
              </h2>
              <button 
          onClick={() => { setShowForm(false); setIsEditing(null); resetForm(); }} 
          className="text-gray-400 hover:text-gray-600 text-3xl font-light transition-colors"
        >
          &times;
        </button>
            </div>
            
            <div className="overflow-y-auto p-8">
              {/* Aquí va toda la lógica de tus pasos de formulario que ya tenías */}
              {/* Solo asegúrate de ocultar el selector de Rol si estás editando */}
              {!isEditing && (
                 <div className="mb-8">
                    <label className={labelClass}>Tipo de usuario</label>
                    <select value={role} onChange={(e) => { setRole(e.target.value); setStep(1); }} className={inputClass}>
                        <option value="">Selecciona un rol</option>
                        <option value="patient">Paciente</option>
                        <option value="therapist">Terapeuta</option>
                        <option value="admin">Administrador</option>
                        <option value="operador">Operador</option>
                    </select>
                 </div>
              )}

        {/* FORMULARIO */}
        {role && (
          <form onSubmit={submit} className="space-y-6 animate-fadeIn">
            
            {/* ======================= ROL: PACIENTE ======================= */}
            {role === "patient" && (
              <>
                {/* PASO 1: DATOS BÁSICOS */}
                {step === 1 && (
                  <div>
                    <h2 className={sectionTitleClass}>Datos Básicos (Paso 1 de 3)</h2>
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className={labelClass}>Nombre *</label>
                        <input type="text" name="firstName" value={form.firstName} onChange={handleChange} className={inputClass} required />
                      </div>
                      <div>
                        <label className={labelClass}>Apellidos *</label>
                        <input type="text" name="lastName" value={form.lastName} onChange={handleChange} className={inputClass} required />
                      </div>
                      <div>
                        <label className={labelClass}>Fecha de Nacimiento *</label>
                        <input type="date" name="birthdate" value={form.birthdate} onChange={handleChange} className={inputClass} required />
                      </div>
                      <div>
                        <label className={labelClass}>Género *</label>
                        <select name="gender" value={form.gender} onChange={handleChange} className={inputClass} required>
                          <option value="">Seleccione</option>
                          <option value="M">Masculino</option>
                          <option value="F">Femenino</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Email (Acceso) *</label>
                        <input type="email" name="email" value={form.email} onChange={handleChange} className={inputClass} required />
                      </div>
                      <div>
                        <label className={labelClass}>Contraseña *</label>
                        <input type="password" name="password" value={form.password} onChange={handleChange} className={inputClass} required />
                      </div>
                      <div>
                        <label className={labelClass}>Estado *</label>
                        <select name="patientStatus" value={form.patientStatus} onChange={handleChange} className={inputClass} required>
                          <option value="activo">Activo</option>
                          <option value="inactivo">Inactivo</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* PASO 2: INFORMACIÓN ADICIONAL */}
                {step === 2 && (
                  <div>
                    <h2 className={sectionTitleClass}>Información Adicional (Paso 2 de 3)</h2>
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className={labelClass}>Ciudad de nacimiento</label>
                        <input type="text" name="birthCity" value={form.birthCity} onChange={handleChange} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Nacionalidad</label>
                        <input type="text" name="nationality" value={form.nationality} onChange={handleChange} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Estado de nacimiento</label>
                        <input type="text" name="birthState" value={form.birthState} onChange={handleChange} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>CURP *</label>
                        <input type="text" name="idType" value={form.idType} onChange={handleChange} className={inputClass} placeholder="18 caracteres" required />
                      </div>
                    </div>
                  </div>
                )}

                {/* PASO 3: CONTACTOS Y CONSENTIMIENTO */}
                {step === 3 && (
                  <div>
                    <h2 className={sectionTitleClass}>Contactos de Emergencia (Paso 3 de 3)</h2>
                    {form.contacts.map((contact, index) => (
                      <div key={index} className="mb-6 border border-gray-200 p-4 rounded-xl bg-gray-50 shadow-sm relative">
                        <h3 className="font-bold text-gray-700 mb-3">Contacto #{index + 1}</h3>
                        <div className="grid md:grid-cols-3 gap-3 mb-3">
                            {/* Campos del contacto */}
                            <div><label className="text-xs text-gray-500">Nombre *</label><input type="text" name="firstName" value={contact.firstName} onChange={(e) => handleContactChange(index, e)} className={inputClass} required /></div>
                            <div><label className="text-xs text-gray-500">Apellido P. *</label><input type="text" name="lastName" value={contact.lastName} onChange={(e) => handleContactChange(index, e)} className={inputClass} required /></div>
                            <div><label className="text-xs text-gray-500">Apellido M.</label><input type="text" name="middleName" value={contact.middleName} onChange={(e) => handleContactChange(index, e)} className={inputClass} /></div>
                            <div><label className="text-xs text-gray-500">Teléfono *</label><input type="text" name="phone" value={contact.phone} onChange={(e) => handleContactChange(index, e)} className={inputClass} required /></div>
                            <div><label className="text-xs text-gray-500">Email</label><input type="email" name="email" value={contact.email} onChange={(e) => handleContactChange(index, e)} className={inputClass} /></div>
                            <div><label className="text-xs text-gray-500">Tel. Adicional</label><input type="text" name="additionalPhone" value={contact.additionalPhone} onChange={(e) => handleContactChange(index, e)} className={inputClass} /></div>
                        </div>
                        
                        {/* Dirección del contacto (Acordeón simplificado o Grid completo) */}
                        <div className="grid md:grid-cols-4 gap-3 mb-3 bg-white p-3 rounded border">
                            <div className="md:col-span-2"><input type="text" name="street" placeholder="Calle" value={contact.street} onChange={(e) => handleContactChange(index, e)} className="w-full text-sm border-b focus:outline-none p-1" /></div>
                            <div><input type="text" name="number" placeholder="Número" value={contact.number} onChange={(e) => handleContactChange(index, e)} className="w-full text-sm border-b focus:outline-none p-1" /></div>
                            <div><input type="text" name="postalCode" placeholder="CP" value={contact.postalCode} onChange={(e) => handleContactChange(index, e)} className="w-full text-sm border-b focus:outline-none p-1" /></div>
                            <div><input type="text" name="neighborhood" placeholder="Colonia" value={contact.neighborhood} onChange={(e) => handleContactChange(index, e)} className="w-full text-sm border-b focus:outline-none p-1" /></div>
                            <div><input type="text" name="city" placeholder="Ciudad" value={contact.city} onChange={(e) => handleContactChange(index, e)} className="w-full text-sm border-b focus:outline-none p-1" /></div>
                            <div><input type="text" name="state" placeholder="Estado" value={contact.state} onChange={(e) => handleContactChange(index, e)} className="w-full text-sm border-b focus:outline-none p-1" /></div>
                            <div><input type="text" name="country" placeholder="País" value={contact.country} onChange={(e) => handleContactChange(index, e)} className="w-full text-sm border-b focus:outline-none p-1" /></div>
                        </div>

                        <label className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                            <input type="checkbox" name="sendReminders" checked={contact.sendReminders} onChange={(e) => handleContactChange(index, e)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                            <span>Enviar recordatorios a este contacto</span>
                        </label>

                        {form.contacts.length > 1 && (
                             <button type="button" onClick={() => removeContact(index)} className="text-red-500 text-sm hover:underline absolute top-4 right-4">Eliminar</button>
                        )}
                      </div>
                    ))}
                    
                    <button type="button" onClick={addContact} className="mb-6 text-indigo-600 font-medium hover:text-indigo-800 flex items-center">
                        + Añadir otro contacto
                    </button>

                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <label className="flex items-center cursor-pointer">
                            <input type="checkbox" name="consent" checked={form.consent} onChange={handleChange} className="h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500" required />
                            <span className="ml-3 text-sm text-gray-700">Acepto el consentimiento para el tratamiento de mis datos personales.</span>
                        </label>
                    </div>
                  </div>
                )}
                
                {/* Botones de Navegación Paciente */}
                <div className="flex justify-between mt-6">
                    {step > 1 && (
                        <button type="button" onClick={handlePrevStep} className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition">Anterior</button>
                    )}
                    {step < 3 ? (
                        <button type="button" onClick={handleNextStep} className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition ml-auto">Siguiente</button>
                    ) : (
                        <button type="submit" disabled={loading} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition ml-auto flex items-center">
                            {loading ? "Registrando..." : "Registrar Paciente"}
                        </button>
                    )}
                </div>
              </>
            )}

            {/* ======================= ROL: TERAPEUTA ======================= */}
            {role === "therapist" && (
              <>
                 <h2 className={sectionTitleClass}>Datos del Terapeuta</h2>
                 {/* Reutiliza el sistema de pasos si quieres, o hazlo en una sola vista como estaba antes para terapeuta, 
                     aquí lo mantendré con la lógica de pasos simple del ejemplo original */}
                 {step === 1 && (
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                             <label className={labelClass}>Nombre *</label>
                             <input type="text" name="firstName" value={form.firstName} onChange={handleChange} className={inputClass} required />
                        </div>
                        <div>
                             <label className={labelClass}>Apellidos *</label>
                             <input type="text" name="lastName" value={form.lastName} onChange={handleChange} className={inputClass} required />
                        </div>
                         <div>
                             <label className={labelClass}>Email *</label>
                             <input type="email" name="email" value={form.email} onChange={handleChange} className={inputClass} required />
                        </div>
                         <div>
                             <label className={labelClass}>Contraseña *</label>
                             <input type="password" name="password" value={form.password} onChange={handleChange} className={inputClass} required />
                        </div>
                        <div>
                             <label className={labelClass}>Teléfono *</label>
                             <input type="text" name="phone" value={form.phone} onChange={handleChange} className={inputClass} required />
                        </div>
                        <div>
                             <label className={labelClass}>Especialización</label>
                             <input type="text" name="specialization" value={form.specialization} onChange={handleChange} className={inputClass} />
                        </div>
                    </div>
                 )}
                 {step === 2 && (
                     <div className="grid md:grid-cols-2 gap-4">
                         <div><label className={labelClass}>Dirección</label><input type="text" name="address" value={form.address} onChange={handleChange} className={inputClass} /></div>
                         <div><label className={labelClass}>Ciudad</label><input type="text" name="city" value={form.city} onChange={handleChange} className={inputClass} /></div>
                         <div><label className={labelClass}>País</label><input type="text" name="country" value={form.country} onChange={handleChange} className={inputClass} /></div>
                     </div>
                 )}

                 <div className="flex justify-between mt-6">
                    {step === 2 && <button type="button" onClick={() => setStep(1)} className="bg-gray-500 text-white px-6 py-2 rounded-lg">Anterior</button>}
                    {step === 1 && <button type="button" onClick={() => setStep(2)} className="bg-indigo-600 text-white px-6 py-2 rounded-lg ml-auto">Siguiente</button>}
                    {step === 2 && <button type="submit" disabled={loading} className="bg-green-600 text-white px-6 py-2 rounded-lg ml-auto">{loading ? "..." : "Registrar Terapeuta"}</button>}
                 </div>
              </>
            )}

            {/* ======================= ROL: ADMIN / OPERADOR ======================= */}
            {(role === "admin" || role === "operador") && (
      <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
        <h2 className={sectionTitleClass}>Datos de Acceso Administrativo</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Email de Acceso *</label>
            <input 
              type="email" 
              name="email" 
              value={form.email} 
              onChange={handleChange} 
              className={inputClass} 
              required 
            />
          </div>
          <div>
            <label className={labelClass}>
              {isEditing ? "Nueva Contraseña (Opcional)" : "Contraseña *"}
            </label>
            <input 
              type="password" 
              name="password" 
              value={form.password} 
              onChange={handleChange} 
              className={inputClass} 
              placeholder={isEditing ? "Dejar vacío para no cambiar" : "Mínimo 6 caracteres"}
              required={!isEditing} // Solo es obligatoria si es un registro nuevo
            />
          </div>
        </div>
        
        {/* Botón de envío específico para estos roles */}
        <div className="mt-8 flex justify-end">
          <button 
            type="submit" 
            disabled={loading} 
            className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg"
          >
            {loading ? "Procesando..." : (isEditing ? "Actualizar Usuario" : "Registrar Usuario")}
          </button>
        </div>
      </div>
    )}

  </form>
)}
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

        <section className="bg-gray-50 p-6 rounded-xl border border-gray-200">
          <h4 className="text-gray-700 font-bold mb-4 flex items-center">🔑 Credenciales de Cuenta</h4>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Correo Electrónico</label>
              <input type="email" className="w-full p-2 border-b-2 border-gray-300 focus:border-blue-500 outline-none transition bg-transparent" 
                value={editForm.email || ""} onChange={(e) => setEditForm({...editForm, email: e.target.value})} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Nueva Contraseña (Opcional)</label>
              <input type="password" placeholder="Dejar en blanco para no cambiar" className="w-full p-2 border-b-2 border-gray-300 focus:border-blue-500 outline-none transition bg-transparent" 
                onChange={(e) => setEditForm({...editForm, password: e.target.value})} />
            </div>
          </div>
        </section>
        
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

{isEditTherapistModalOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-fadeIn">
      
      {/* Header Fijo */}
      <div className="sticky top-0 bg-emerald-700 p-6 text-white flex justify-between items-center z-10">
        <div>
          <h3 className="text-2xl font-bold">Gestión de Terapeuta</h3>
          <p className="text-emerald-100 opacity-80">Modificando perfil profesional de {editForm.firstName}</p>
        </div>
        <button onClick={() => setIsEditTherapistModalOpen(false)} className="text-white text-2xl">&times;</button>
      </div>

      <form onSubmit={guardarCambios} className="p-8 space-y-8">

        {/* SECCIÓN CREDENCIALES */}
        <section className="bg-gray-50 p-6 rounded-xl border border-gray-200">
          <h4 className="text-gray-700 font-bold mb-4 flex items-center">🔑 Cuenta de Acceso</h4>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Correo Institucional</label>
              <input type="email" className="w-full p-2 border-b-2 border-gray-300 focus:border-emerald-500 outline-none bg-transparent" 
                value={editForm.email || ""} onChange={(e) => setEditForm({...editForm, email: e.target.value})} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Cambiar Contraseña</label>
              <input type="password" placeholder="Solo si desea actualizar" className="w-full p-2 border-b-2 border-gray-300 focus:border-emerald-500 outline-none bg-transparent" 
                onChange={(e) => setEditForm({...editForm, password: e.target.value})} />
            </div>
          </div>
        </section>
        
        {/* SECCIÓN PROFESIONAL */}
        <section>
          <h4 className="text-emerald-600 font-bold border-b pb-2 mb-4">🩺 Datos Profesionales</h4>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-500">Nombre(s)</label>
              <input type="text" className="w-full p-2 border rounded" value={editForm.firstName} onChange={(e) => setEditForm({...editForm, firstName: e.target.value})} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500">Apellidos</label>
              <input type="text" className="w-full p-2 border rounded" value={editForm.lastName} onChange={(e) => setEditForm({...editForm, lastName: e.target.value})} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500">Especialidad</label>
              <input type="text" className="w-full p-2 border rounded" value={editForm.specialization} onChange={(e) => setEditForm({...editForm, specialization: e.target.value})} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500">Teléfono de Contacto</label>
              <input type="text" className="w-full p-2 border rounded" value={editForm.phone} onChange={(e) => setEditForm({...editForm, phone: e.target.value})} />
            </div>
              <div>
              <label className="text-xs font-bold text-gray-500">Direccion</label>
              <input type="text" className="w-full p-2 border rounded" value={editForm.address} onChange={(e) => setEditForm({...editForm, address: e.target.value})} />
            </div>
              <div>
              <label className="text-xs font-bold text-gray-500">Cuidad</label>
              <input type="text" className="w-full p-2 border rounded" value={editForm.city} onChange={(e) => setEditForm({...editForm, city: e.target.value})} />
            </div>
             <div>
              <label className="text-xs font-bold text-gray-500">Pais</label>
              <input type="text" className="w-full p-2 border rounded" value={editForm.country} onChange={(e) => setEditForm({...editForm, country: e.target.value})} />
            </div>
  
          </div>
        </section>

        {/* Footer con Botones */}
        <div className="flex justify-end space-x-4 sticky bottom-0 bg-white pt-4 border-t">
          <button type="button" onClick={() => setIsEditTherapistModalOpen(false)} className="px-6 py-2 text-gray-400">Descartar</button>
          <button type="submit" className="px-10 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition">
            Guardar Cambios Profesional
          </button>
        </div>
      </form>
    </div>
  </div>
)}

{isEditAdminModalOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl animate-fadeIn">
      
      {/* Header */}
      <div className="bg-slate-800 p-6 text-white rounded-t-2xl flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold">Gestión de Personal Administrativo</h3>
          <p className="text-slate-300 text-sm">Configurando accesos para {editForm.email}</p>
        </div>
        <button onClick={() => setIsEditAdminModalOpen(false)} className="text-white text-2xl">&times;</button>
      </div>

      <form onSubmit={guardarCambios} className="p-8 space-y-6">
        <div className="grid grid-cols-1 gap-6">
          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Correo Electrónico</label>
            <input 
              type="email" 
              className="w-full p-3 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-slate-500 outline-none"
              value={editForm.email || ""} 
              onChange={(e) => setEditForm({...editForm, email: e.target.value})} 
            />
          </div>

          {/* Rol */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nivel de Acceso (Rol)</label>
            <select 
              className="w-full p-3 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-slate-500 outline-none"
              value={editForm.role} 
              onChange={(e) => setEditForm({...editForm, role: e.target.value})}
            >
              <option value="admin">Administrador (Acceso Total)</option>
              <option value="operador">Operador (Acceso Limitado)</option>
            </select>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Restablecer Contraseña</label>
            <input 
              type="password" 
              placeholder="Dejar en blanco para mantener actual"
              className="w-full p-3 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-slate-500 outline-none"
              onChange={(e) => setEditForm({...editForm, password: e.target.value})} 
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <button type="button" onClick={() => setIsEditAdminModalOpen(false)} className="px-6 py-2 text-gray-500">Cerrar</button>
          <button type="submit" className="px-8 py-2 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-900 transition shadow-lg">
            Actualizar Permisos
          </button>
        </div>
      </form>
    </div>
  </div>
)}
    </div>
  );
}

