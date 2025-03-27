"use client";

import React, { useState, useEffect } from "react";
import uniquid from "uniquid";
import { useAuth } from "../context/AuthContext.js";
import { useRouter } from "next/navigation";

// Expresión regular para validar el CURP
const curpPattern = /^[a-zA-Z0-9]{18}$/;

const RegistroPaciente = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [gender, setGender] = useState("");
  const [patientStatus, setPatientStatus] = useState("");
  const [birthCity, setBirthCity] = useState("");
  const [nationality, setNationality] = useState("");
  const [birthState, setBirthState] = useState("");
  const [idType, setIdType] = useState("");
  const [contacts, setContacts] = useState([
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
  ]);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(1); // Estado para el paso actual

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login'); // Redirige solo si no está autenticado
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return <p>Cargando...</p>; // Muestra un loader en lugar de redirigir inmediatamente
  }

  if (!isAuthenticated) {
    return null; // Evita mostrar contenido mientras se redirige
  }

  const addContact = () => {
    setContacts([
      ...contacts,
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
    ]);
  };

  const handleContactChange = (index, event) => {
    const { name, value, type, checked } = event.target;
    const updatedContacts = [...contacts];
    if (type === "checkbox") {
      updatedContacts[index][name] = checked;
    } else {
      updatedContacts[index][name] = value;
    }
    setContacts(updatedContacts);
  };

  const removeContact = (index) => {
    const updatedContacts = [...contacts];
    updatedContacts.splice(index, 1);
    setContacts(updatedContacts);
  };

  const validateCURP = (curp) => {
    return curpPattern.test(curp);
  };

  const agregarPaciente = async (e) => {
    e.preventDefault();

    if (contacts.length === 0) {
      alert("Debe haber al menos un contacto de emergencia.");
      return;
    }

    // Validar el CURP
    if (!validateCURP(idType)) {
      alert("El CURP debe tener 18 caracteres, solo letras y números.");
      return;
    }

    const res = await fetch("/api/patient", {
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify({
        idPatient: uniquid(),
        firstName,
        lastName,
        birthdate,
        gender,
        patientStatus,
        birthCity,
        nationality,
        birthState,
        idType,
        contacts,
      }),
    });

    limpiarCampos();
    const { msg } = await res.json();
    setError(msg);
  };

  const limpiarCampos = () => {
    setFirstName("");
    setLastName("");
    setBirthdate("");
    setGender("");
    setPatientStatus("");
    setBirthCity("");
    setNationality("");
    setBirthState("");
    setIdType("");
    setContacts([
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
    ]);
    setConsent(false);
    setError("");
  };

  const handleNextStep = () => {
    setStep(step + 1); // Avanzar al siguiente paso
  };

  const handlePrevStep = () => {
    setStep(step - 1); // Regresar al paso anterior
  };

  return (
    <form
      className="max-w-md mx-auto p-4 bg-gray-100"
      onSubmit={agregarPaciente}
    >
      <h1 className="text-black font-extrabold">REGISTRO DE PACIENTES</h1>

      {/* Paso 1: Datos personales */}
      {step === 1 && (
        <div>
          <div className="mb-4">
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
              Nombre<span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 text-black"
              placeholder="Escribe el nombre del paciente"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
              Apellidos<span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 text-black"
              placeholder="Escribe los apellidos del paciente"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="birthdate" className="block text-sm font-medium text-gray-700">
              Fecha de nacimiento<span className="text-red-600">*</span> (DD/MM/AAAA)
            </label>
            <input
              type="date"
              id="birthdate"
              name="birthdate"
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
              className="w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 text-black"
              required
            />
          </div>
        </div>
      )}

      {/* Paso 2: Información adicional */}
      {step === 2 && (
        <div>
          <div className="mb-4">
            <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
              Género<span className="text-red-600">*</span> (M o F)
            </label>
            <input
              type="text"
              id="gender"
              name="gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 text-black"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="patientStatus" className="block text-sm font-medium text-gray-700">
              Estado del paciente<span className="text-red-600">*</span>
            </label>
            <select
              id="patientStatus"
              name="patientStatus"
              value={patientStatus}
              onChange={(e) => setPatientStatus(e.target.value)}
              className="w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 text-black"
              required
            >
              <option value="" disabled>
                Seleccione una opción
              </option>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>
        </div>
      )}

      {/* Paso 3: Datos del contacto */}
      {step === 3 && (
        <div>
          {/* Aquí iría la sección de contactos */}
          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={consent}
                onChange={() => setConsent(!consent)}
                className="form-checkbox h-5 w-5 text-indigo-600 rounded-md focus:ring-indigo-500"
                required
              />
              <span className="ml-2 text-sm text-gray-700">
                Acepto el consentimiento para el tratamiento de mis datos.
              </span>
            </label>
          </div>
        </div>
      )}

      {/* Botones de navegación */}
      <div className="flex justify-between mt-4">
        {step > 1 && (
          <button
            type="button"
            onClick={handlePrevStep}
            className="bg-gray-500 text-white px-4 py-2 rounded-md"
          >
            Paso anterior
          </button>
        )}
        {step < 3 ? (
          <button
            type="button"
            onClick={handleNextStep}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md"
          >
            Siguiente paso
          </button>
        ) : (
          <button
            type="submit"
            className="bg-indigo-600 text-white px-4 py-2 rounded-md"
          >
            Registrar Paciente
          </button>
        )}
      </div>
    </form>
  );
};

export default RegistroPaciente;
