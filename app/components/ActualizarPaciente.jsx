"use client";

import React, { useState } from "react";
import axios from "axios";
import Link from "next/link";

// Expresión regular para validar el CURP
const curpPattern = /^[a-zA-Z0-9]{18}$/;

const ActualizarPaciente = ({
  id,
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
}) => {
  const [newFirstName, setNewFirstName] = useState(firstName);
  const [newLastName, setNewLastName] = useState(lastName);
  const [newBirthdate, setNewBirthdate] = useState(birthdate);
  const [newGender, setNewGender] = useState(gender);
  const [newPatientStatus, setNewPatientStatus] = useState(patientStatus);
  const [newBirthCity, setNewBirthCity] = useState(birthCity);
  const [newNationality, setNewNationality] = useState(nationality);
  const [newBirthState, setNewBirthState] = useState(birthState);
  const [newIdType, setNewIdType] = useState(idType);
  const [newContacts, setNewContacts] = useState(contacts);

  const handleContactChange = (index, event) => {
    const { name, value, type, checked } = event.target;
    const updatedContacts = [...newContacts];
    if (type === "checkbox") {
      updatedContacts[index][name] = checked;
    } else {
      updatedContacts[index][name] = value;
    }
    setNewContacts(updatedContacts);
  };

  const removeContact = (index) => {
    const updatedContacts = [...newContacts];
    updatedContacts.splice(index, 1);
    setNewContacts(updatedContacts);
  };

  const addContact = () => {
    setNewContacts([
      ...newContacts,
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

  // Función para validar el CURP
  const validateCURP = (curp) => {
    return curpPattern.test(curp);
  };

  const updatePatient = async (e) => {
    e.preventDefault();

    if (newContacts.length === 0) {
      alert("Debe haber al menos un contacto de emergencia.");
      return;
    }

    // Validar el CURP
    if (!validateCURP(newIdType)) {
      alert("El CURP debe tener 18 caracteres, solo letras y números.");
      return;
    }

      const res = await fetch(`http://localhost:3000/api/patient/${id}`, {
        method: "PUT",
        headers: {
          "Content-type": "application/json",
        },
        body: JSON.stringify({
          newFirstName,
          newLastName,
          newBirthdate,
          newGender,
          newPatientStatus,
          newBirthCity,
          newNationality,
          newBirthState,
          newIdType,
          newContacts,
        }),
      });

      if (!res.ok) {
        throw new Error("Error al actualizar el Paciente");
      }
      alert("Paciente actualizado exitosamente");
    
  };

  return (
    <form className="max-w-md mx-auto p-4 bg-gray-100">
      <h1 className="text-black font-extrabold">ACTUALIZACIÓN DE PACIENTES</h1>
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
          value={newFirstName}
          onChange={(e) => setNewFirstName(e.target.value)}
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
          value={newLastName}
          onChange={(e) => setNewLastName(e.target.value)}
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
          value={newBirthdate}
          onChange={(e) => setNewBirthdate(e.target.value)}
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
          value={newGender}
          onChange={(e) => setNewGender(e.target.value)}
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
          value={newPatientStatus}
          onChange={(e) => setNewPatientStatus(e.target.value)}
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
          value={newBirthCity}
          onChange={(e) => setNewBirthCity(e.target.value)}
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
          value={newNationality}
          onChange={(e) => setNewNationality(e.target.value)}
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
          value={newBirthState}
          onChange={(e) => setNewBirthState(e.target.value)}
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
          value={newIdType}
          onChange={(e) => setNewIdType(e.target.value)}
          className="w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 text-black"
          placeholder="Escribe el CURP del paciente"
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">
          Contactos
        </label>
        {newContacts.map((contact, index) => (
          <div key={index} className="mb-4 border p-4 rounded-lg">
            <h2 className="text-lg font-semibold">Contacto {index + 1}</h2>
            <div className="mb-4">
              <label
                htmlFor={`contactFirstName_${index}`}
                className="block text-sm font-medium text-gray-700"
              >
                Nombre
              </label>
              <input
                type="text"
                id={`contactFirstName_${index}`}
                name="firstName"
                value={contact.firstName}
                onChange={(e) => handleContactChange(index, e)}
                className="w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 text-black"
                placeholder="Nombre del contacto"
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor={`contactLastName_${index}`}
                className="block text-sm font-medium text-gray-700"
              >
                Apellido
              </label>
              <input
                type="text"
                id={`contactLastName_${index}`}
                name="lastName"
                value={contact.lastName}
                onChange={(e) => handleContactChange(index, e)}
                className="w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 text-black"
                placeholder="Apellido del contacto"
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor={`contactMiddleName_${index}`}
                className="block text-sm font-medium text-gray-700"
              >
                Segundo Apellido
              </label>
              <input
                type="text"
                id={`contactMiddleName_${index}`}
                name="middleName"
                value={contact.middleName}
                onChange={(e) => handleContactChange(index, e)}
                className="w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 text-black"
                placeholder="Segundo apellido del contacto"
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor={`contactPhone_${index}`}
                className="block text-sm font-medium text-gray-700"
              >
                Teléfono
              </label>
              <input
                type="tel"
                id={`contactPhone_${index}`}
                name="phone"
                value={contact.phone}
                onChange={(e) => handleContactChange(index, e)}
                className="w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 text-black"
                placeholder="Número de teléfono del contacto"
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor={`contactEmail_${index}`}
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                type="email"
                id={`contactEmail_${index}`}
                name="email"
                value={contact.email}
                onChange={(e) => handleContactChange(index, e)}
                className="w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 text-black"
                placeholder="Correo electrónico del contacto"
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor={`contactAdditionalPhone_${index}`}
                className="block text-sm font-medium text-gray-700"
              >
                Teléfono Adicional
              </label>
              <input
                type="tel"
                id={`contactAdditionalPhone_${index}`}
                name="additionalPhone"
                value={contact.additionalPhone}
                onChange={(e) => handleContactChange(index, e)}
                className="w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 text-black"
                placeholder="Número de teléfono adicional del contacto"
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor={`contactSendReminders_${index}`}
                className="flex items-center"
              >
                <input
                  type="checkbox"
                  id={`contactSendReminders_${index}`}
                  name="sendReminders"
                  checked={contact.sendReminders}
                  onChange={(e) => handleContactChange(index, e)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Enviar recordatorios a este teléfono también
                </span>
              </label>
            </div>
            <div className="mb-4">
              <label
                htmlFor={`contactStreet_${index}`}
                className="block text-sm font-medium text-gray-700"
              >
                Calle
              </label>
              <input
                type="text"
                id={`contactStreet_${index}`}
                name="street"
                value={contact.street}
                onChange={(e) => handleContactChange(index, e)}
                className="w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 text-black"
                placeholder="Calle del contacto"
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor={`contactNumber_${index}`}
                className="block text-sm font-medium text-gray-700"
              >
                Número
              </label>
              <input
                type="text"
                id={`contactNumber_${index}`}
                name="number"
                value={contact.number}
                onChange={(e) => handleContactChange(index, e)}
                className="w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 text-black"
                placeholder="Número del contacto"
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor={`contactPostalCode_${index}`}
                className="block text-sm font-medium text-gray-700"
              >
                Código Postal
              </label>
              <input
                type="text"
                id={`contactPostalCode_${index}`}
                name="postalCode"
                value={contact.postalCode}
                onChange={(e) => handleContactChange(index, e)}
                className="w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 text-black"
                placeholder="Código postal del contacto"
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor={`contactNeighborhood_${index}`}
                className="block text-sm font-medium text-gray-700"
              >
                Colonia
              </label>
              <input
                type="text"
                id={`contactNeighborhood_${index}`}
                name="neighborhood"
                value={contact.neighborhood}
                onChange={(e) => handleContactChange(index, e)}
                className="w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 text-black"
                placeholder="Colonia del contacto"
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor={`contactCity_${index}`}
                className="block text-sm font-medium text-gray-700"
              >
                Ciudad
              </label>
              <input
                type="text"
                id={`contactCity_${index}`}
                name="city"
                value={contact.city}
                onChange={(e) => handleContactChange(index, e)}
                className="w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 text-black"
                placeholder="Ciudad del contacto"
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor={`contactState_${index}`}
                className="block text-sm font-medium text-gray-700"
              >
                Estado
              </label>
              <input
                type="text"
                id={`contactState_${index}`}
                name="state"
                value={contact.state}
                onChange={(e) => handleContactChange(index, e)}
                className="w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 text-black"
                placeholder="Estado del contacto"
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor={`contactCountry_${index}`}
                className="block text-sm font-medium text-gray-700"
              >
                País
              </label>
              <input
                type="text"
                id={`contactCountry_${index}`}
                name="country"
                value={contact.country}
                onChange={(e) => handleContactChange(index, e)}
                className="w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 text-black"
                placeholder="País del contacto"
              />
            </div>
            <button
              type="button"
              onClick={() => removeContact(index)}
              className="text-red-600 hover:text-red-700"
            >
              Eliminar Contacto
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addContact}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
        >
          Agregar Contacto
        </button>
      </div>
      <div className="mt-4 flex justify-between items-center">
        <Link href={"/pacientes"}>
          <button
            type="submit"
            onClick={updatePatient}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          >
            Actualizar Paciente
          </button>

        </Link>
        <Link href={"/pacientes"} className=" text-black">Regresar</Link>
      </div>
    </form>
  );
};

export default ActualizarPaciente;
