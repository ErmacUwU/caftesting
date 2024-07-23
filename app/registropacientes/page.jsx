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
  const [contacts, setContacts] = useState([
    {
      firstName: "",
      lastNameP: "",
      lastNameM: "",
      phone: "",
      email: "",
      additionalPhone: "",
      sendReminders: false,
      address: {
        street: "",
        number: "",
        postalCode: "",
        neighborhood: "",
        city: "",
        state: "",
        country: "",
      },
    },
  ]);
  const [error, setError] = useState("");

  const handleContactChange = (index, field, value) => {
    const updatedContacts = [...contacts];
    if (field === "address") {
      updatedContacts[index].address = {
        ...updatedContacts[index].address,
        ...value,
      };
    } else {
      updatedContacts[index][field] = value;
    }
    setContacts(updatedContacts);
  };

  const addContact = () => {
    setContacts([
      ...contacts,
      {
        firstName: "",
        lastNameP: "",
        lastNameM: "",
        phone: "",
        email: "",
        additionalPhone: "",
        sendReminders: false,
        address: {
          street: "",
          number: "",
          postalCode: "",
          neighborhood: "",
          city: "",
          state: "",
          country: "",
        },
      },
    ]);
  };

  const agregarPaciente = async (e) => {
    e.preventDefault();

    const paciente = {
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
      consent,
      contacts,
    };

    try {
      const res = await fetch("/api/patient", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paciente),
      });

      const { msg } = await res.json();
      if (res.ok) {
        limpiarCampos();
      } else {
        setError(msg);
      }
    } catch (err) {
      setError("Error al registrar el paciente");
    }
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
    setContacts([
      {
        firstName: "",
        lastNameP: "",
        lastNameM: "",
        phone: "",
        email: "",
        additionalPhone: "",
        sendReminders: false,
        address: {
          street: "",
          number: "",
          postalCode: "",
          neighborhood: "",
          city: "",
          state: "",
          country: "",
        },
      },
    ]);
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
      <div className="mb-4">
        <h2 className="text-black font-bold">Contactos</h2>
        {contacts.map((contact, index) => (
          <div key={index} className="mb-4 border p-4 rounded">
            <h3 className="text-lg font-semibold">Contacto {index + 1}</h3>
            <div className="mb-4">
              <label
                htmlFor={`contact-${index}-firstName`}
                className="block text-sm font-medium text-gray-700"
              >
                Nombre del contacto
              </label>
              <input
                type="text"
                id={`contact-${index}-firstName`}
                value={contact.firstName}
                onChange={(e) =>
                  handleContactChange(index, "firstName", e.target.value)
                }
                className="w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 text-black"
                placeholder="Nombre del contacto"
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor={`contact-${index}-lastNameP`}
                className="block text-sm font-medium text-gray-700"
              >
                Apellido Paterno
              </label>
              <input
                type="text"
                id={`contact-${index}-lastNameP`}
                value={contact.lastNameP}
                onChange={(e) =>
                  handleContactChange(index, "lastNameP", e.target.value)
                }
                className="w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 text-black"
                placeholder="Apellido Paterno"
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor={`contact-${index}-lastNameM`}
                className="block text-sm font-medium text-gray-700"
              >
                Apellido Materno
              </label>
              <input
                type="text"
                id={`contact-${index}-lastNameM`}
                value={contact.lastNameM}
                onChange={(e) =>
                  handleContactChange(index, "lastNameM", e.target.value)
                }
                className="w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 text-black"
                placeholder="Apellido Materno"
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor={`contact-${index}-phone`}
                className="block text-sm font-medium text-gray-700"
              >
                Teléfono
              </label>
              <input
                type="text"
                id={`contact-${index}-phone`}
                value={contact.phone}
                onChange={(e) =>
                  handleContactChange(index, "phone", e.target.value)
                }
                className="w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 text-black"
                placeholder="Teléfono"
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor={`contact-${index}-email`}
                className="block text-sm font-medium text-gray-700"
              >
                Correo electrónico
              </label>
              <input
                type="email"
                id={`contact-${index}-email`}
                value={contact.email}
                onChange={(e) =>
                  handleContactChange(index, "email", e.target.value)
                }
                className="w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 text-black"
                placeholder="Correo electrónico"
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor={`contact-${index}-additionalPhone`}
                className="block text-sm font-medium text-gray-700"
              >
                Teléfono adicional
              </label>
              <input
                type="text"
                id={`contact-${index}-additionalPhone`}
                value={contact.additionalPhone}
                onChange={(e) =>
                  handleContactChange(index, "additionalPhone", e.target.value)
                }
                className="w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 text-black"
                placeholder="Teléfono adicional"
              />
            </div>
            <div className="mb-4 flex items-center">
              <input
                type="checkbox"
                id={`contact-${index}-sendReminders`}
                checked={contact.sendReminders}
                onChange={(e) =>
                  handleContactChange(index, "sendReminders", e.target.checked)
                }
                className="form-checkbox h-5 w-5 text-indigo-600 rounded-md focus:ring-indigo-500"
              />
              <label
                htmlFor={`contact-${index}-sendReminders`}
                className="ml-2 text-sm text-gray-700"
              >
                Enviar recordatorios
              </label>
            </div>
            <div className="mb-4">
              <h4 className="text-md font-semibold">Dirección</h4>
              <div className="mb-2">
                <label
                  htmlFor={`contact-${index}-address-street`}
                  className="block text-sm font-medium text-gray-700"
                >
                  Calle
                </label>
                <input
                  type="text"
                  id={`contact-${index}-address-street`}
                  value={contact.address.street}
                  onChange={(e) =>
                    handleContactChange(index, "address", {
                      street: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 text-black"
                  placeholder="Calle"
                />
              </div>
              <div className="mb-2">
                <label
                  htmlFor={`contact-${index}-address-number`}
                  className="block text-sm font-medium text-gray-700"
                >
                  Número
                </label>
                <input
                  type="text"
                  id={`contact-${index}-address-number`}
                  value={contact.address.number}
                  onChange={(e) =>
                    handleContactChange(index, "address", {
                      number: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 text-black"
                  placeholder="Número"
                />
              </div>
              <div className="mb-2">
                <label
                  htmlFor={`contact-${index}-address-postalCode`}
                  className="block text-sm font-medium text-gray-700"
                >
                  Código Postal
                </label>
                <input
                  type="text"
                  id={`contact-${index}-address-postalCode`}
                  value={contact.address.postalCode}
                  onChange={(e) =>
                    handleContactChange(index, "address", {
                      postalCode: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 text-black"
                  placeholder="Código Postal"
                />
              </div>
              <div className="mb-2">
                <label
                  htmlFor={`contact-${index}-address-neighborhood`}
                  className="block text-sm font-medium text-gray-700"
                >
                  Colonia
                </label>
                <input
                  type="text"
                  id={`contact-${index}-address-neighborhood`}
                  value={contact.address.neighborhood}
                  onChange={(e) =>
                    handleContactChange(index, "address", {
                      neighborhood: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 text-black"
                  placeholder="Colonia"
                />
              </div>
              <div className="mb-2">
                <label
                  htmlFor={`contact-${index}-address-city`}
                  className="block text-sm font-medium text-gray-700"
                >
                  Ciudad
                </label>
                <input
                  type="text"
                  id={`contact-${index}-address-city`}
                  value={contact.address.city}
                  onChange={(e) =>
                    handleContactChange(index, "address", {
                      city: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 text-black"
                  placeholder="Ciudad"
                />
              </div>
              <div className="mb-2">
                <label
                  htmlFor={`contact-${index}-address-state`}
                  className="block text-sm font-medium text-gray-700"
                >
                  Estado
                </label>
                <input
                  type="text"
                  id={`contact-${index}-address-state`}
                  value={contact.address.state}
                  onChange={(e) =>
                    handleContactChange(index, "address", {
                      state: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 text-black"
                  placeholder="Estado"
                />
              </div>
              <div className="mb-2">
                <label
                  htmlFor={`contact-${index}-address-country`}
                  className="block text-sm font-medium text-gray-700"
                >
                  País
                </label>
                <input
                  type="text"
                  id={`contact-${index}-address-country`}
                  value={contact.address.country}
                  onChange={(e) =>
                    handleContactChange(index, "address", {
                      country: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 text-black"
                  placeholder="País"
                />
              </div>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={addContact}
          className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Agregar Contacto
        </button>
      </div>
      <button
        type="submit"
        className="w-full py-2 px-4 bg-green-500 text-white rounded hover:bg-green-600"
      >
        Registrar Paciente
      </button>
      {error && <p className="mt-4 text-red-600">{error}</p>}
    </form>
  );
};

export default RegistroPaciente;
