"use client";

import React, { useState } from "react";
import axios from "axios";
import uniquid from "uniquid";

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
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");

  const agregarPaciente = async (e) => {
    e.preventDefault();

    /* const paciente = {
      firstName,
      lastName,
      birthdate,
      gender,
      patientStatus,
      birthCity,
      nationality,
      birthState,
      idType,
    }; */

    const res = await fetch("/api/patient", {
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify({
        firstName,
        lastName,
        birthdate,
        gender,
        patientStatus,
        birthCity,
        nationality,
        birthState,
        idType
      })
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
    setConsent(false);
    setError("")
  };

  return (
    <form
      className="max-w-md mx-auto p-4 bg-gray-100"
      onSubmit={agregarPaciente}
    >
      <h1 className="text-black font-extrabold">REGISTRO DE PACIENTES</h1>
      <div className="mb-4">
        <label
          htmlFor="firstName"
          className="block text-sm font-medium text-gray-700"
        >
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
        <label
          htmlFor="lastName"
          className="block text-sm font-medium text-gray-700"
        >
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
        <label
          htmlFor="birthdate"
          className="block text-sm font-medium text-gray-700"
        >
          Fecha de nacimiento<span className="text-red-600">*</span>{" "}
          (DD/MM/AAAA)
        </label>
        <input
          type="text"
          id="birthdate"
          name="birthdate"
          value={birthdate}
          onChange={(e) => setBirthdate(e.target.value)}
          className="w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 text-black"
          placeholder="DD/MM/AAAA"
          required
        />
      </div>
      <div className="mb-4">
        <label
          htmlFor="gender"
          className="block text-sm font-medium text-gray-700"
        >
          Género<span className="text-red-600">*</span> (M o F)
        </label>
        <input
          type="text"
          id="gender"
          name="gender"
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          className="w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 text-black"
          placeholder="M o F"
          required
        />
      </div>
      <div className="mb-4">
        <label
          htmlFor="patientStatus"
          className="block text-sm font-medium text-gray-700"
        >
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
      <div className="mb-4">
        <label
          htmlFor="birthCity"
          className="block text-sm font-medium text-gray-700"
        >
          Ciudad de nacimiento
        </label>
        <input
          type="text"
          id="birthCity"
          name="birthCity"
          value={birthCity}
          onChange={(e) => setBirthCity(e.target.value)}
          className="w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 text-black"
          placeholder="Ingrese la ciudad de nacimiento del paciente"
        />
      </div>
      <div className="mb-4">
        <label
          htmlFor="nationality"
          className="block text-sm font-medium text-gray-700"
        >
          Nacionalidad
        </label>
        <input
          type="text"
          id="nationality"
          name="nationality"
          value={nationality}
          onChange={(e) => setNationality(e.target.value)}
          className="w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 text-black"
          placeholder="Ingrese la nacionalidad del paciente"
        />
      </div>
      <div className="mb-4">
        <label
          htmlFor="birthState"
          className="block text-sm font-medium text-gray-700"
        >
          Estado de nacimiento
        </label>
        <input
          type="text"
          id="birthState"
          name="birthState"
          value={birthState}
          onChange={(e) => setBirthState(e.target.value)}
          className="w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 text-black"
          placeholder="Ingrese el estado de nacimiento del paciente"
        />
      </div>
      <div className="mb-4">
        <label
          htmlFor="idType"
          className="block text-sm font-medium text-gray-700"
        >
          Tipo de identificación
        </label>
        <input
          type="text"
          id="idType"
          name="idType"
          value={idType}
          onChange={(e) => setIdType(e.target.value)}
          className="w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 text-black"
          placeholder="Ingrese el tipo de identificación del paciente"
        />
      </div>
      <div className="mb-4">
        <label htmlFor="consent" className="flex items-center">
          <input
            type="checkbox"
            id="consent"
            name="consent"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="form-checkbox h-5 w-5 text-indigo-600 rounded-md focus:ring-indigo-500"
            required
          />
          <span className="ml-2 text-sm text-gray-700">
            Consentimiento para el tratamiento de sus datos para fines mentales
            firmado
          </span>
        </label>
      </div>
      {error && <p className="text-red-600">{error}</p>}
      <div className="mt-4">
        <button
          type="submit"
          className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Guardar
        </button>
      </div>
    </form>
  );
};

export default RegistroPaciente;
