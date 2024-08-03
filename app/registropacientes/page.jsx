"use client";

import React, { useState } from "react";
import uniquid from "uniquid";

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

  // Función para validar el CURP
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
          type="date"
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
          CURP
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
        <label
          htmlFor="contacts"
          className="block text-sm font-medium text-gray-700"
        >
          Contactos
        </label>
        {contacts.map((contact, index) => (
          <div key={index} className="mb-4 border p-4 rounded-md shadow-sm">
            <div className="mb-4">
              <label
                htmlFor={`contact-firstName-${index}`}
                className="block text-sm font-medium text-gray-700"
              >
                Nombre(s) *
              </label>
              <input
                type="text"
                id={`contact-firstName-${index}`}
                name="firstName"
                value={contact.firstName}
                onChange={(e) => handleContactChange(index, e)}
                className="w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 text-black"
                placeholder="Nombre(s)"
                required
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor={`contact-lastName-${index}`}
                className="block text-sm font-medium text-gray-700"
              >
                Apellido Paterno *
              </label>
              <input
                type="text"
                id={`contact-lastName-${index}`}
                name="lastName"
                value={contact.lastName}
                onChange={(e) => handleContactChange(index, e)}
                className="w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 text-black"
                placeholder="Apellido Paterno"
                required
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor={`contact-middleName-${index}`}
                className="block text-sm font-medium text-gray-700"
              >
                Apellido Materno
              </label>
              <input
                type="text"
                id={`contact-middleName-${index}`}
                name="middleName"
                value={contact.middleName}
                onChange={(e) => handleContactChange(index, e)}
                className="w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 text-black"
                placeholder="Apellido Materno"
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor={`contact-phone-${index}`}
                className="block text-sm font-medium text-gray-700"
              >
                Teléfono *
              </label>
              <input
                type="text"
                id={`contact-phone-${index}`}
                name="phone"
                value={contact.phone}
                onChange={(e) => handleContactChange(index, e)}
                className="w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 text-black"
                placeholder="Teléfono"
                required
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor={`contact-email-${index}`}
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                type="email"
                id={`contact-email-${index}`}
                name="email"
                value={contact.email}
                onChange={(e) => handleContactChange(index, e)}
                className="w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 text-black"
                placeholder="Email"
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor={`contact-additionalPhone-${index}`}
                className="block text-sm font-medium text-gray-700"
              >
                Teléfono adicional
              </label>
              <input
                type="text"
                id={`contact-additionalPhone-${index}`}
                name="additionalPhone"
                value={contact.additionalPhone}
                onChange={(e) => handleContactChange(index, e)}
                className="w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 text-black"
                placeholder="Teléfono adicional"
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor={`contact-sendReminders-${index}`}
                className="flex items-center"
              >
                <input
                  type="checkbox"
                  id={`contact-sendReminders-${index}`}
                  name="sendReminders"
                  checked={contact.sendReminders}
                  onChange={(e) => handleContactChange(index, e)}
                  className="form-checkbox h-5 w-5 text-indigo-600 rounded-md focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Enviar recordatorios a este teléfono también
                </span>
              </label>
            </div>
            <div className="mb-4">
              <label
                htmlFor={`contact-street-${index}`}
                className="block text-sm font-medium text-gray-700"
              >
                Calle
              </label>
              <input
                type="text"
                id={`contact-street-${index}`}
                name="street"
                value={contact.street}
                onChange={(e) => handleContactChange(index, e)}
                className="w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 text-black"
                placeholder="Calle"
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor={`contact-number-${index}`}
                className="block text-sm font-medium text-gray-700"
              >
                Número
              </label>
              <input
                type="text"
                id={`contact-number-${index}`}
                name="number"
                value={contact.number}
                onChange={(e) => handleContactChange(index, e)}
                className="w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 text-black"
                placeholder="Número"
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor={`contact-postalCode-${index}`}
                className="block text-sm font-medium text-gray-700"
              >
                Código postal
              </label>
              <input
                type="text"
                id={`contact-postalCode-${index}`}
                name="postalCode"
                value={contact.postalCode}
                onChange={(e) => handleContactChange(index, e)}
                className="w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 text-black"
                placeholder="Código postal"
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor={`contact-neighborhood-${index}`}
                className="block text-sm font-medium text-gray-700"
              >
                Colonia
              </label>
              <input
                type="text"
                id={`contact-neighborhood-${index}`}
                name="neighborhood"
                value={contact.neighborhood}
                onChange={(e) => handleContactChange(index, e)}
                className="w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 text-black"
                placeholder="Colonia"
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor={`contact-city-${index}`}
                className="block text-sm font-medium text-gray-700"
              >
                Ciudad
              </label>
              <input
                type="text"
                id={`contact-city-${index}`}
                name="city"
                value={contact.city}
                onChange={(e) => handleContactChange(index, e)}
                className="w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 text-black"
                placeholder="Ciudad"
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor={`contact-state-${index}`}
                className="block text-sm font-medium text-gray-700"
              >
                Estado
              </label>
              <input
                type="text"
                id={`contact-state-${index}`}
                name="state"
                value={contact.state}
                onChange={(e) => handleContactChange(index, e)}
                className="w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 text-black"
                placeholder="Estado"
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor={`contact-country-${index}`}
                className="block text-sm font-medium text-gray-700"
              >
                País
              </label>
              <input
                type="text"
                id={`contact-country-${index}`}
                name="country"
                value={contact.country}
                onChange={(e) => handleContactChange(index, e)}
                className="w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 text-black"
                placeholder="País"
              />
            </div>
            <button
              type="button"
              onClick={() => removeContact(index)}
              className="text-red-600 hover:text-red-800 focus:outline-none"
            >
              Eliminar contacto
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addContact}
          className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-md"
        >
          Añadir Contacto
        </button>
      </div>
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
      {error && <div className="mb-4 text-red-600 text-sm">{error}</div>}
      <button
        type="submit"
        className="bg-indigo-600 text-white px-4 py-2 rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        Registrar Paciente
      </button>
    </form>
  );
};

export default RegistroPaciente;
