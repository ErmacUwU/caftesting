"use client";

import React, { useState } from "react";
import axios from "axios";
import uniquid from "uniquid";

const RegistroPaciente = () => {
  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [fecha, setFecha] = useState("");
  const [genero, setGenero] = useState("");
  const [estadoPaciente, setEstadoPaciente] = useState("");
  const [ciudadNacimiento, setCiudadNacimiento] = useState("");
  const [nacionalidad, setNacionalidad] = useState("");
  const [estadoNacimiento, setEstadoNacimiento] = useState("");
  const [identificacion, setIdentificacion] = useState("");
  const [casilla, setCasilla] = useState(false);

  const AgregarPaciente = async (e) => {
    e.preventDefault();

    if (!casilla) {
      alert("Marque la casilla para continuar");
      return;
    }

    const paciente = {
      idpaciente: uniquid(),
      nombre,
      apellidos,
      fecha,
      genero,
      estadoPaciente,
      ciudadNacimiento,
      nacionalidad,
      estadoNacimiento,
      identificacion,
    };

    try {
      const response = await axios.post(
        "api/paciente/agregarPaciente",
        paciente
      );
      console.log("Exitoso", response.data);
      limpiarCampos();
    } catch (error) {
      console.log("Fallido", error);
    }
  };

  const limpiarCampos = () => {
    setNombre("");
    setApellidos("");
    setFecha("");
    setGenero("");
    setEstadoPaciente("");
    setCiudadNacimiento("");
    setNacionalidad("");
    setEstadoNacimiento("");
    setIdentificacion("");
    setCasilla(false);
  };

  return (
    <form
      className="max-w-md mx-auto p-4 bg-gray-100"
      onSubmit={AgregarPaciente}
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
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
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
          value={apellidos}
          onChange={(e) => setApellidos(e.target.value)}
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
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
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
          value={genero}
          onChange={(e) => setGenero(e.target.value)}
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
          value={estadoPaciente}
          onChange={(e) => setEstadoPaciente(e.target.value)}
          className="w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 text-black"
          required
        >
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
          value={ciudadNacimiento}
          onChange={(e) => setCiudadNacimiento(e.target.value)}
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
          value={nacionalidad}
          onChange={(e) => setNacionalidad(e.target.value)}
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
          value={estadoNacimiento}
          onChange={(e) => setEstadoNacimiento(e.target.value)}
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
          value={identificacion}
          onChange={(e) => setIdentificacion(e.target.value)}
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
            checked={casilla}
            onChange={(e) => setCasilla(e.target.checked)}
            className="form-checkbox h-5 w-5 text-indigo-600 rounded-md focus:ring-indigo-500"
            required
          />
          <span className="ml-2 text-sm text-gray-700">
            Consentimiento para el tratamiento de sus datos para fines mentales
            firmado
          </span>
        </label>
      </div>
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
