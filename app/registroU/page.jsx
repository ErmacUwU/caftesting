"use client";

import { useState } from "react";
import uniquid from "uniquid";

export default function RegistroUsuario() {
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const [form, setForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    birthdate: "",
    gender: "",
    patientStatus: "activo",
    phone: "",
    specialization: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    const payload = {
      email: form.email,
      password: form.password,
      role,
    };

    // PACIENTE
    if (role === "patient") {
      payload.patientData = {
        idPatient: uniquid(),
        firstName: form.firstName,
        lastName: form.lastName,
        birthdate: form.birthdate,
        gender: form.gender,
        patientStatus: form.patientStatus,
      };
    }

    // TERAPEUTA
    if (role === "therapist") {
      payload.therapistData = {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        specialization: form.specialization,
      };
    }

    try {
      const res = await fetch("/api/usuarioTrue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setMsg(data.error || "Error al crear usuario");
      } else {
        setMsg("Usuario creado correctamente ✅");
      }
    } catch (err) {
      setMsg("Error de conexión");
    }

    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-lg">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Registro de Usuario
      </h1>

      {msg && (
        <div className="mb-4 p-3 rounded bg-indigo-50 text-indigo-700">
          {msg}
        </div>
      )}

      <form onSubmit={submit} className="space-y-6">
        {/* Rol */}
        <div>
          <label className="font-medium">Tipo de usuario</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full mt-1 p-2 border rounded"
            required
          >
            <option value="">Selecciona</option>
            <option value="patient">Paciente</option>
            <option value="therapist">Terapeuta</option>
            <option value="admin">Administrador</option>
            <option value="operador">Operador</option>
          </select>
        </div>

        {/* Acceso */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            name="email"
            placeholder="Email"
            className="input"
            onChange={handleChange}
            required
          />
          <input
            name="password"
            type="password"
            placeholder="Contraseña"
            className="input"
            onChange={handleChange}
            required
          />
        </div>

        {/* Campos comunes */}
        {(role === "patient" || role === "therapist") && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              name="firstName"
              placeholder="Nombre"
              className="input"
              onChange={handleChange}
              required
            />
            <input
              name="lastName"
              placeholder="Apellidos"
              className="input"
              onChange={handleChange}
              required
            />
          </div>
        )}

        {/* Paciente */}
        {role === "patient" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="date"
              name="birthdate"
              className="input"
              onChange={handleChange}
              required
            />
            <select
              name="gender"
              className="input"
              onChange={handleChange}
              required
            >
              <option value="">Género</option>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
            </select>
          </div>
        )}

        {/* Terapeuta */}
        {role === "therapist" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              name="phone"
              placeholder="Teléfono"
              className="input"
              onChange={handleChange}
              required
            />
            <input
              name="specialization"
              placeholder="Especialización"
              className="input"
              onChange={handleChange}
            />
          </div>
        )}

        <button
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition"
        >
          {loading ? "Guardando..." : "Registrar Usuario"}
        </button>
      </form>
    </div>
  );
}
