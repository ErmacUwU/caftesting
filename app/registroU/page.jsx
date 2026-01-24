"use client";

import { useState } from "react";
import uniquid from "uniquid";

export default function RegistroUsuario() {
  const [role, setRole] = useState("");
  const [step, setStep] = useState(1);
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

    // terapeuta
    phone: "",
    specialization: "",
    address: "",
    city: "",
    country: "",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");

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
      const res = await fetch("/api/usuarioTrue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setMsg(res.ok ? "Usuario creado correctamente ✅" : data.error);
    } catch {
      setMsg("Error de conexión");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-center mb-6">
          Registro de Usuario
        </h1>

        {msg && (
          <div className="mb-4 text-center p-3 rounded bg-indigo-50 text-indigo-700">
            {msg}
          </div>
        )}

        <form onSubmit={submit} className="space-y-6">
          {/* ROL */}
          <div>
            <label className="label">Tipo de usuario</label>
            <select
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                setStep(1);
              }}
              className="input"
              required
            >
              <option value="">Selecciona</option>
              <option value="patient">Paciente</option>
              <option value="therapist">Terapeuta</option>
              <option value="admin">Administrador</option>
              <option value="operador">Operador</option>
            </select>
          </div>

          {/* ACCESO */}
          <div className="grid md:grid-cols-2 gap-4">
            <input name="email" placeholder="Email" className="input" onChange={handleChange} required />
            <input name="password" type="password" placeholder="Contraseña" className="input" onChange={handleChange} required />
          </div>

          {/* CAMPOS COMUNES */}
          {(role === "patient" || role === "therapist") && (
            <div className="grid md:grid-cols-2 gap-4">
              <input name="firstName" placeholder="Nombre" className="input" onChange={handleChange} required />
              <input name="lastName" placeholder="Apellidos" className="input" onChange={handleChange} required />
            </div>
          )}

          {/* PACIENTE */}
          {role === "patient" && (
            <div className="grid md:grid-cols-2 gap-4">
              <input type="date" name="birthdate" className="input" onChange={handleChange} required />
              <select name="gender" className="input" onChange={handleChange} required>
                <option value="">Género</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
              </select>
            </div>
          )}

          {/* TERAPEUTA – PASO 1 */}
          {role === "therapist" && step === 1 && (
            <>
              <Stepper step={step} />
              <div className="grid md:grid-cols-2 gap-4">
                <input name="phone" placeholder="Teléfono" className="input" onChange={handleChange} required />
                <input name="specialization" placeholder="Especialización" className="input" onChange={handleChange} />
              </div>

              <div className="text-right">
                <button type="button" onClick={() => setStep(2)} className="btn-primary">
                  Siguiente
                </button>
              </div>
            </>
          )}

          {/* TERAPEUTA – PASO 2 */}
          {role === "therapist" && step === 2 && (
            <>
              <Stepper step={step} />
              <div className="grid md:grid-cols-2 gap-4">
                <input name="address" placeholder="Dirección" className="input" onChange={handleChange} />
                <input name="city" placeholder="Ciudad" className="input" onChange={handleChange} />
                <input name="country" placeholder="País" className="input" onChange={handleChange} />
              </div>

              <div className="flex justify-between">
                <button type="button" onClick={() => setStep(1)} className="btn-secondary">
                  Anterior
                </button>
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? "Guardando..." : "Registrar"}
                </button>
              </div>
            </>
          )}

          {/* ADMIN / OPERADOR */}
          {(role === "admin" || role === "operador") && (
            <button disabled={loading} className="btn-primary w-full">
              Registrar Usuario
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

/* COMPONENTES AUX */
const Stepper = ({ step }) => (
  <div className="flex items-center gap-4 mb-4">
    <div className={`step ${step >= 1 && "active"}`}>1</div>
    <div className="flex-1 h-1 bg-gray-200 rounded">
      <div className={`h-1 bg-indigo-600 rounded ${step === 2 && "w-full"}`} />
    </div>
    <div className={`step ${step === 2 && "active"}`}>2</div>
  </div>
);
