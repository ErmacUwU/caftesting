"use client";

import React, { useState } from "react";
import axios from "axios";
import uniquid from "uniquid";

const registroTerapeuta = () => {

  
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [error, setError] = useState("");

  const agregarTerapista = async (e) =>{
    e.preventDefault();

    const res = await fetch("/api/therapist", {
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify({
        idTherapist: uniquid(),
        firstName,
        lastName,
        email,
        phone,
        specialization,
        address,
        city,
        country
      }),
    });

      limpiarCampos();
      const { msg } = await res.json();
      setError(msg);
  }

  const limpiarCampos = () => {
    setFirstName("");
    setLastName("");
    setPhone("");
    setEmail("");
    setSpecialization("");
    setAddress("");
    setCity("");
    setCountry("");
    setError("");
    
  };

  return (
    <form
      className="max-w-md mx-auto p-4 bg-gray-100"
      onSubmit={agregarTerapista}
    >
      <h1 className="text-black font-extrabold">REGISTRO DE TERAPEUTAS</h1>
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
          placeholder="Escribe el nombre del terapeuta"
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
          placeholder="Escribe los apellidos del terapeuta"
          required
        />
      </div>

      <div className="mb-4">
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700"
        >
          Correo electrónico<span className="text-red-600">*</span>
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 text-black"
          placeholder="Escribe el correo electrónico del terapeuta"
          required
        />
      </div>

      <div className="mb-4">
        <label
          htmlFor="phone"
          className="block text-sm font-medium text-gray-700"
        >
          Teléfono<span className="text-red-600">*</span>
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 text-black"
          placeholder="Escribe el teléfono del terapeuta"
          required
        />
      </div>

      <div className="mb-4">
        <label
          htmlFor="specialization"
          className="block text-sm font-medium text-gray-700"
        >
          Especialización
        </label>
        <input
          type="text"
          id="specialization"
          name="specialization"
          value={specialization}
          onChange={(e) => setSpecialization(e.target.value)}
          className="w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 text-black"
          placeholder="Escribe la especialización del terapeuta"
        />
      </div>

      <div className="mb-4">
        <label
          htmlFor="address"
          className="block text-sm font-medium text-gray-700"
        >
          Dirección
        </label>
        <input
          type="text"
          id="address"
          name="address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 text-black"
          placeholder="Escribe la dirección del terapeuta"
        />
      </div>

      <div className="mb-4">
        <label
          htmlFor="city"
          className="block text-sm font-medium text-gray-700"
        >
          Ciudad
        </label>
        <input
          type="text"
          id="city"
          name="city"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 text-black"
          placeholder="Escribe la ciudad del terapeuta"
        />
      </div>

      <div className="mb-4">
        <label
          htmlFor="country"
          className="block text-sm font-medium text-gray-700"
        >
          País
        </label>
        <input
          type="text"
          id="country"
          name="country"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 text-black"
          placeholder="Escribe el país del terapeuta"
        />
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

export default registroTerapeuta;
