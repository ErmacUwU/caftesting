"use client";

import React, { useState } from "react";
import uniquid from "uniquid";

// Expresión regular para validar el CURP
const curpPattern = /^[a-zA-Z0-9]{18}$/;

export default function RegistroUsuario() {
  const [role, setRole] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

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
  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    setError("");

    // Validaciones específicas de Paciente antes de enviar
    if (role === "patient") {
      if (form.contacts.length === 0) {
        setError("Debe haber al menos un contacto de emergencia.");
        setLoading(false);
        return;
      }
      if (!validateCURP(form.idType)) {
        setError("El CURP debe tener 18 caracteres, solo letras y números.");
        setLoading(false);
        return;
      }
      if (!form.consent) {
        setError("Debe aceptar el consentimiento.");
        setLoading(false);
        return;
      }
    }

    const payload = {
      email: form.email,
      password: form.password,
      role,
    };

    if (role === "patient") {
      payload.patientData = {
        idPatient: uniquid(),
        firstName: form.firstName,
        lastName: form.lastName,
        birthdate: form.birthdate,
        gender: form.gender,
        patientStatus: form.patientStatus,
        birthCity: form.birthCity,
        nationality: form.nationality,
        birthState: form.birthState,
        idType: form.idType, // CURP
        contacts: form.contacts,
        email: form.email, // Redundante pero solicitado en el source original
        password: form.password,
      };
    }

    if (role === "therapist") {
      payload.therapistData = {
        idTherapist: uniquid(),
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        specialization: form.specialization,
        address: form.address,
        city: form.city,
        country: form.country,
      };
    }

    try {
      const res = await fetch("/api/usuarioTrue", { // OJO: Verifica si tu endpoint es usuarioTrue o patient
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setMsg("Usuario creado correctamente ✅");
        // Reiniciar form si es necesario
      } else {
        setError(data.msg || data.error || "Error al registrar");
      }
    } catch (err) {
      console.error(err);
      setError("Error de conexión");
    }

    setLoading(false);
  };

  // --- NAVEGACIÓN DE PASOS ---
  const handleNextStep = () => setStep(step + 1);
  const handlePrevStep = () => setStep(step - 1);

  // Clases CSS reutilizables para mantener el estilo limpio
  const inputClass = "w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none text-gray-700";
  const labelClass = "block text-sm font-medium text-gray-600 mb-1";
  const sectionTitleClass = "text-xl font-semibold text-gray-800 border-b pb-2 mb-4";

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-center mb-8 text-indigo-900">
          Registro de Usuario
        </h1>

        {/* Mensajes de feedback */}
        {msg && <div className="mb-6 p-3 rounded bg-green-100 text-green-700 text-center border border-green-300">{msg}</div>}
        {error && <div className="mb-6 p-3 rounded bg-red-100 text-red-700 text-center border border-red-300">{error}</div>}

        {/* SELECT DE ROL */}
        <div className="mb-8">
          <label className={labelClass}>Tipo de usuario</label>
          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              setStep(1); // Resetear pasos al cambiar rol
              setError("");
              setMsg("");
            }}
            className={inputClass}
          >
            <option value="">Selecciona un rol</option>
            <option value="patient">Paciente</option>
            <option value="therapist">Terapeuta</option>
            <option value="admin">Administrador</option>
            <option value="operador">Operador</option>
          </select>
        </div>

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
               <div>
                    <h2 className={sectionTitleClass}>Datos de Acceso</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div><label className={labelClass}>Email *</label><input type="email" name="email" value={form.email} onChange={handleChange} className={inputClass} required /></div>
                        <div><label className={labelClass}>Contraseña *</label><input type="password" name="password" value={form.password} onChange={handleChange} className={inputClass} required /></div>
                    </div>
                    <div className="mt-6 flex justify-end">
                        <button type="submit" disabled={loading} className="bg-indigo-600 text-white px-6 py-2 rounded-lg">{loading ? "..." : "Registrar Usuario"}</button>
                    </div>
               </div>
            )}

          </form>
        )}
      </div>
    </div>
  );
}