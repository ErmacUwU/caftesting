"use client";

import { useState } from "react";
import uniquid from "uniquid";

export default function RegistroUsuarioSistema() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");

    try {
      const res = await fetch("/api/userSystem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idUserSystem: uniquid(),
          name,
          email,
          password,
          role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.msg?.[0] || "Error al registrar usuario");
        return;
      }

      setSuccess("Usuario registrado correctamente");
      setName(""); setEmail(""); setPassword(""); setRole("");
    } catch {
      setError("Error del servidor");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow space-y-4">
      <h2 className="text-2xl font-semibold">Usuario del Sistema</h2>

      {error && <p className="text-red-600">{error}</p>}
      {success && <p className="text-green-600">{success}</p>}

      <input
        placeholder="Nombre"
        value={name}
        onChange={e => setName(e.target.value)}
        className="w-full border px-3 py-2 rounded"
        required
      />

      <input
        type="email"
        placeholder="Correo"
        value={email}
        onChange={e => setEmail(e.target.value)}
        className="w-full border px-3 py-2 rounded"
        required
      />

      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={e => setPassword(e.target.value)}
        className="w-full border px-3 py-2 rounded"
        required
      />

      <select
        value={role}
        onChange={e => setRole(e.target.value)}
        className="w-full border px-3 py-2 rounded"
        required
      >
        <option value="">Selecciona rol</option>
        <option value="admin">Administrador</option>
        <option value="operador">Operador</option>
      </select>

      <button className="w-full bg-green-600 text-white py-2 rounded">
        Registrar Usuario
      </button>
    </form>
  );
}
