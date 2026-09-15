"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import uniquid from "uniquid";
import { useAuth } from "../context/AuthContext.js";
import useDebounce from "@/hooks/useDebounce";

// Expresión regular para validar el CURP
const curpPattern = /^[a-zA-Z0-9]{18}$/;

export default function RegistroUsuario() {
  // --- RUTA PROTEGIDA: solo administradores ---
  // Esta vista no tenía ninguna validación de sesión/rol propia; dependía
  // por completo del middleware (cookies). Si el rol quedaba guardado con
  // otra capitalización (p. ej. "Admin"), el middleware rebotaba a /login
  // una y otra vez sin que el cliente supiera por qué, generando el
  // "bucle infinito" reportado. Se agrega el mismo patrón ya usado en
  // otras vistas (ver app/usuarios/page.jsx y app/citas/page.jsx).
  const { isAuthenticated, isLoading, userRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // 1. No redirigir mientras aún se está verificando la sesión.
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    // 2. Comparación de rol sin sensibilidad a mayúsculas/minúsculas.
    if (String(userRole || "").toLowerCase() !== "admin") {
      router.replace("/");
    }
  }, [isAuthenticated, isLoading, userRole, router]);

  const [role, setRole] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  // --- NUEVOS ESTADOS ---
  const [users, setUsers] = useState([]); // Lista total
  const [filterRole, setFilterRole] = useState("all"); // Filtro de vista
  const [searchTerm, setSearchTerm] = useState(""); // Búsqueda de usuarios
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [isEditing, setIsEditing] = useState(null); // ID del usuario editando
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ contacts: [] });
  const [isEditTherapistModalOpen, setIsEditTherapistModalOpen] = useState(false);
  const [isEditAdminModalOpen, setIsEditAdminModalOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/usuarioTrue?role=${filterRole}`);
      const data = await res.json();
      const listaUsuarios = Array.isArray(data) ? data : data.users || [];
      setUsers(listaUsuarios);
    } catch (err) {
      console.error(err);
      setError("Error al conectar con la base de datos");
    } finally {
      setLoading(false);
    }
  }, [filterRole]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]); // Se ejecuta cada vez que el usuario cambia de pestaña de rol

  // 2. Función para extraer el nombre independientemente del rol
  const getDisplayName = useCallback((user) => {
    if (user.patientProfile)
      return `${user.patientProfile.firstName} ${user.patientProfile.lastName}`;
    if (user.therapistProfile)
      return `${user.therapistProfile.firstName} ${user.therapistProfile.lastName}`;
    return user.email; // Fallback
  }, []);

  const handleEditClick = useCallback((user) => {
    const profile =
      user.role === "patient" ? user.patientProfile : user.therapistProfile;

    setEditForm({
      userId: user._id,
      profileId: profile?._id || profile,
      role: user.role,
      email: user.email,
      password: "",
      ...profile,
    });

    if (user.role === "patient") setIsEditModalOpen(true);
    else if (user.role === "therapist") setIsEditTherapistModalOpen(true);
    else setIsEditAdminModalOpen(true);
  }, []);

  const handleViewClick = useCallback((user) => {
    const profile =
      user.role === "patient" ? user.patientProfile : user.therapistProfile;
    setEditForm({
      userId: user._id,
      profileId: profile?._id || profile,
      role: user.role,
      email: user.email,
      password: "",
      ...profile,
      createdAt: user.createdAt,
    });
    setIsViewMode(true);
    if (user.role === "patient") setIsEditModalOpen(true);
    else if (user.role === "therapist") setIsEditTherapistModalOpen(true);
    else setIsEditAdminModalOpen(true);
  }, []);

  const guardarCambios = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const resAcc = await fetch(`/api/usuarioTrue/${editForm.userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: editForm.email,
          password: editForm.password,
          role: editForm.role,
          isAccountUpdate: true,
        }),
      });

      const isStaff = editForm.role === "admin" || editForm.role === "operador";

      if (!isStaff && editForm.profileId && editForm.profileId !== "undefined") {
        await fetch(`/api/usuarioTrue/${editForm.profileId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            role: editForm.role,
            profileData: editForm,
          }),
        });
      }

      if (resAcc.ok) {
        alert(
          "¡Cambios guardados! El usuario se moverá de pestaña si cambiaste su rol. ✅"
        );
        setIsEditModalOpen(false);
        setIsEditTherapistModalOpen(false);
        setIsEditAdminModalOpen(false);
        fetchUsers();
      }
    } catch (error) {
      alert("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  // Estado unificado
  const [form, setForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
    birthdate: "",
    gender: "",
    patientStatus: "activo",
    birthCity: "",
    nationality: "",
    birthState: "",
    idType: "",
    consent: false,
    contacts: [
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
    ],
    specialization: "",
    address: "",
    city: "",
    country: "",
  });

  const resetForm = () => {
    setForm({
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      phone: "",
      birthdate: "",
      gender: "",
      patientStatus: "activo",
      birthCity: "",
      nationality: "",
      birthState: "",
      idType: "",
      consent: false,
      contacts: [
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
      ],
      specialization: "",
      address: "",
      city: "",
      country: "",
    });
    setStep(1);
    setRole("");
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const addContact = () => {
    setForm({
      ...form,
      contacts: [
        ...form.contacts,
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
      ],
    });
  };

  const removeContact = (index) => {
    const updatedContacts = [...form.contacts];
    updatedContacts.splice(index, 1);
    setForm({ ...form, contacts: updatedContacts });
  };

  const handleEditContactChange = (index, event) => {
    const { name, value, type, checked } = event.target;
    const currentContacts = Array.isArray(editForm?.contacts) ? editForm.contacts : [];
    const updatedContacts = [...currentContacts];

    if (!updatedContacts[index]) {
      updatedContacts[index] = {};
    }

    const valorFinal = type === "checkbox" ? checked : value;

    updatedContacts[index] = {
      ...updatedContacts[index],
      [name]: valorFinal,
    };

    setEditForm({ ...editForm, contacts: updatedContacts });
  };

  const handleRegisterContactChange = (index, event) => {
    const { name, value, type, checked } = event.target;
    const currentContacts = Array.isArray(form?.contacts) ? form.contacts : [];
    const updatedContacts = [...currentContacts];

    if (!updatedContacts[index]) {
      updatedContacts[index] = {};
    }

    const valorFinal = type === "checkbox" ? checked : value;

    updatedContacts[index] = {
      ...updatedContacts[index],
      [name]: valorFinal,
    };

    setForm({ ...form, contacts: updatedContacts });
  };

  const validateCURP = (curp) => {
    return curpPattern.test(curp);
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMsg("");

    const url = "/api/usuarioTrue";
    const method = "POST";

    const payload = {
      email: form.email,
      password: form.password,
      role: role,
    };

    if (role === "patient") {
      payload.patientData = { ...form };
    } else if (role === "therapist") {
      payload.therapistData = { ...form };
    } else if (role === "admin" || role === "operador") {
      payload.adminData = { ...form };
    }

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setMsg("¡Usuario registrado con éxito! ✅");
        setTimeout(() => {
          resetForm();
          setShowForm(false);
          fetchUsers();
        }, 1500);
      } else {
        setError(data.error || "No se pudo completar el registro");
      }
    } catch (err) {
      console.error("Error al registrar:", err);
      setError("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const agregarContacto = () => {
    setEditForm({
      ...editForm,
      contacts: [
        ...(editForm.contacts || []),
        {
          firstName: "",
          lastName: "",
          secondLastName: "",
          phone: "",
          email: "",
          additionalPhone: "",
          street: "",
          houseNumber: "",
          zipCode: "",
          neighborhood: "",
          city: "",
          state: "",
          country: "",
          sendRecordatorios: false,
        },
      ],
    });
  };

  const eliminarContacto = (indexABorrar) => {
    const nuevosContactos = editForm.contacts.filter(
      (_, index) => index !== indexABorrar
    );
    setEditForm({ ...editForm, contacts: nuevosContactos });
  };

  const eliminarUsuario = useCallback(async (user) => {
    if (
      !confirm(
        `¿Estás seguro de eliminar a ${getDisplayName(
          user
        )}? Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }

    try {
      const profileId =
        user.role === "patient"
          ? user.patientProfile?._id || user.patientProfile
          : user.therapistProfile?._id || user.therapistProfile;

      const response = await fetch(`/api/usuarioTrue/${user._id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: user.role,
          profileId: profileId,
        }),
      });

      if (response.ok) {
        alert("Usuario eliminado correctamente ✅");
        fetchUsers();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      alert("Error al intentar conectar con el servidor");
    }
  }, [getDisplayName, fetchUsers]);

  // Filtrado (con debounce) + orden alfabético del listado de usuarios.
  const filteredUsers = useMemo(
    () =>
      users
        .filter((user) => {
          const matchesRole = filterRole === "all" || user.role === filterRole;

          const search = debouncedSearchTerm.toLowerCase().trim();

          const name = getDisplayName(user).toLowerCase();
          const email = (user.email || "").toLowerCase();
          const specialization = (
            user.therapistProfile?.specialization || ""
          ).toLowerCase();

          const matchesSearch =
            !search ||
            name.includes(search) ||
            email.includes(search) ||
            specialization.includes(search);

          return matchesRole && matchesSearch;
        })
        .sort((a, b) =>
          getDisplayName(a).localeCompare(getDisplayName(b), "es", {
            sensitivity: "base",
          })
        ),
    [users, filterRole, debouncedSearchTerm, getDisplayName]
  );

  const handleNextStep = () => setStep(step + 1);
  const handlePrevStep = () => setStep(step - 1);

  const inputClass =
    "w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none text-gray-700";
  const labelClass = "block text-sm font-medium text-gray-600 mb-1";
  const sectionTitleClass =
    "text-xl font-semibold text-gray-800 border-b pb-2 mb-4";

  // --- SOLO LECTURA: helpers para el modal de Visualizar ---
  const formatDate = (dateStr) => {
    if (!dateStr) return "No disponible";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "No disponible";
    return date.toLocaleDateString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const closeViewModal = () => {
    setIsEditModalOpen(false);
    setIsEditTherapistModalOpen(false);
    setIsEditAdminModalOpen(false);
  };

  const renderViewField = (label, value, key) => (
    <div key={key}>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
        {label}
      </p>
      <p className="text-gray-800 font-bold break-words">{value}</p>
    </div>
  );

  const renderUserDetailsView = () => {
    const isPatient = editForm.role === "patient";
    const isTherapist = editForm.role === "therapist";
    const fullName =
      [editForm.firstName, editForm.lastName].filter(Boolean).join(" ") ||
      "—";

    const roleBadgeClass =
      {
        patient: "bg-blue-100 text-blue-700",
        therapist: "bg-purple-100 text-purple-700",
        admin: "bg-red-100 text-red-700",
        operador: "bg-amber-100 text-amber-700",
      }[editForm.role] || "bg-gray-100 text-gray-700";

    const roleLabel =
      {
        patient: "Paciente",
        therapist: "Terapeuta",
        admin: "Administrador",
        operador: "Operador",
      }[editForm.role] || editForm.role;

    const roleBadge = (
      <span
        className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${roleBadgeClass}`}
      >
        {roleLabel}
      </span>
    );

    const statusBadge = isPatient ? (
      <span
        className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
          editForm.patientStatus === "inactivo"
            ? "bg-gray-200 text-gray-600"
            : "bg-green-100 text-green-700"
        }`}
      >
        {editForm.patientStatus === "inactivo" ? "Inactivo" : "Activo"}
      </span>
    ) : isTherapist ? (
      <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">
        {editForm.specialization || "Sin especialidad"}
      </span>
    ) : (
      <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500">
        No aplica
      </span>
    );

    const fields = [
      { label: "Nombre completo", value: fullName },
      { label: "Correo Electrónico", value: editForm.email || "—" },
      { label: "Rol", value: roleBadge, isBadge: true },
      {
        label: isPatient
          ? "Estatus"
          : isTherapist
          ? "Especialidad"
          : "Estatus/Especialidad",
        value: statusBadge,
        isBadge: true,
      },
      { label: "Teléfono", value: editForm.phone || "—" },
      { label: "Fecha de Registro", value: formatDate(editForm.createdAt) },
    ];

    if (isPatient) {
      fields.push(
        { label: "CURP", value: editForm.idType || "—" },
        {
          label: "Género",
          value:
            editForm.gender === "M"
              ? "Masculino"
              : editForm.gender === "F"
              ? "Femenino"
              : "—",
        },
        { label: "Ciudad de Nacimiento", value: editForm.birthCity || "—" },
        { label: "Estado de Nacimiento", value: editForm.birthState || "—" },
        { label: "Nacionalidad", value: editForm.nationality || "—" }
      );
    }

    if (isTherapist) {
      fields.push(
        { label: "Dirección", value: editForm.address || "—" },
        { label: "Ciudad", value: editForm.city || "—" },
        { label: "País", value: editForm.country || "—" }
      );
    }

    return (
      <div className="p-8">
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-gray-800">
            Detalles del Usuario
          </h3>
          <p className="text-gray-400 text-sm">Información de solo lectura</p>
        </div>

        <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {fields.map((field, idx) =>
              field.isBadge ? (
                <div key={idx}>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                    {field.label}
                  </p>
                  {field.value}
                </div>
              ) : (
                renderViewField(field.label, field.value, idx)
              )
            )}
          </div>

          {isPatient && editForm.contacts?.length > 0 && (
            <div className="mt-8">
              <h4 className="text-indigo-600 font-bold border-b pb-2 mb-4">
                Contactos de Emergencia
              </h4>
              <div className="space-y-4">
                {editForm.contacts.map((contact, index) => (
                  <div
                    key={index}
                    className="bg-white p-4 rounded-xl border border-gray-200"
                  >
                    <p className="font-bold text-gray-700 mb-2">
                      Contacto #{index + 1}
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                      {renderViewField(
                        "Nombre",
                        [
                          contact.firstName,
                          contact.lastName,
                          contact.middleName,
                        ]
                          .filter(Boolean)
                          .join(" ") || "—",
                        "name"
                      )}
                      {renderViewField(
                        "Teléfono",
                        contact.phone || "—",
                        "phone"
                      )}
                      {renderViewField(
                        "Email",
                        contact.email || "—",
                        "email"
                      )}
                      {renderViewField(
                        "Tel. Adicional",
                        contact.additionalPhone || "—",
                        "additionalPhone"
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end mt-8 pt-4 border-t">
          <button
            type="button"
            onClick={closeViewModal}
            className="px-8 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition shadow-lg"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  };

  // 3. Pantalla de carga mientras se verifica la sesión: evita que se
  // dispare cualquier redirección (o se muestre el panel) antes de tiempo.
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Verificando sesión...</p>
      </div>
    );
  }

  // Sesión ya resuelta pero sin acceso: el useEffect de arriba ya está
  // redirigiendo, así que no renderizamos el panel mientras tanto.
  if (!isAuthenticated || String(userRole || "").toLowerCase() !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-6">
      {/* CABECERA */}
      <div className="w-full max-w-6xl flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-indigo-900">
            Panel de Usuarios
          </h1>
          <p className="text-gray-500">
            Administra pacientes, terapeutas y personal.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-transform hover:scale-105"
        >
          + Nuevo Registro
        </button>
      </div>

      {/* FILTROS Y TABLA */}
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          {/* Barra de búsqueda */}
          <div className="mb-4">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre, email o especialidad..."
                className="w-full p-3 pl-11 rounded-xl border border-gray-300 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-700"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                🔍
              </span>
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-lg"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Botones de roles */}
          <div className="flex gap-2 flex-wrap">
            {["all", "patient", "therapist", "admin", "operador"].map((r) => {
              const labels = {
                all: "Todos",
                patient: "Pacientes",
                therapist: "Terapeutas",
                admin: "Administradores",
                operador: "Operadores",
              };

              return (
                <button
                  key={r}
                  onClick={() => setFilterRole(r)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    filterRole === r
                      ? "bg-indigo-600 text-white"
                      : "bg-white text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {labels[r] || r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Nombre / Email</th>
                <th className="px-6 py-4">Rol</th>
                <th className="px-6 py-4">Estatus/Especialidad</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((user) => {
                return (
                  <tr
                    key={user.id || user._id}
                    className="hover:bg-indigo-50/30 transition"
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-800">
                        {getDisplayName(user)}
                      </div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-bold ${
                          {
                            patient: "bg-blue-100 text-blue-700",
                            therapist: "bg-purple-100 text-purple-700",
                            admin: "bg-red-100 text-red-700",
                            operador: "bg-amber-100 text-amber-700",
                          }[user.role] || "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {{
                          patient: "Paciente",
                          therapist: "Terapeuta",
                          admin: "Administrador",
                          operador: "Operador",
                        }[user.role] || user.role}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600">
                      {user.role === "patient"
                        ? user.patientProfile?.patientStatus || "Activo"
                        : user.therapistProfile?.specialization || "General"}
                    </td>

                    <td className="px-6 py-4 text-center flex justify-center gap-3">
                      <button
                        onClick={() => handleViewClick(user)}
                        className="text-sky-600 hover:text-sky-800 font-semibold text-sm"
                      >
                        Visualizar
                      </button>
                      <button
                        onClick={() => {
                          setIsViewMode(false);
                          handleEditClick(user);
                        }}
                        className="text-indigo-600 hover:text-indigo-900 font-semibold text-sm"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => eliminarUsuario(user)}
                        className="text-red-600 hover:text-red-900 font-semibold text-sm"
                      >
                        Borrar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredUsers.length === 0 && (
            <div className="p-10 text-center text-gray-400">
              No se encontraron usuarios con este rol.
            </div>
          )}
        </div>
      </div>

      {/* MODAL NUEVO REGISTRO */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowForm(false)}
          ></div>
          <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-2xl font-bold text-indigo-900">
                {isEditing
                  ? `Editando: ${form.firstName}`
                  : "Registro de Usuario"}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setIsEditing(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600 text-3xl font-light transition-colors"
              >
                &times;
              </button>
            </div>

            <div className="overflow-y-auto p-8">
              {!isEditing && (
                <div className="mb-8">
                  <label className={labelClass}>Tipo de usuario</label>
                  <select
                    value={role}
                    onChange={(e) => {
                      setRole(e.target.value);
                      setStep(1);
                    }}
                    className={inputClass}
                  >
                    <option value="">Selecciona un rol</option>
                    <option value="patient">Paciente</option>
                    <option value="therapist">Terapeuta</option>
                    <option value="admin">Administrador</option>
                    <option value="operador">Operador</option>
                  </select>
                </div>
              )}

              {/* FORMULARIO */}
              {role && (
                <form onSubmit={submit} className="space-y-6 animate-fadeIn">
                  {/* ======================= ROL: PACIENTE ======================= */}
                  {role === "patient" && (
                    <>
                      {/* PASO 1: DATOS BÁSICOS */}
                      {step === 1 && (
                        <div>
                          <h2 className={sectionTitleClass}>
                            Datos Básicos (Paso 1 de 3)
                          </h2>
                          <div className="grid md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className={labelClass}>Nombre *</label>
                              <input
                                type="text"
                                name="firstName"
                                value={form.firstName}
                                onChange={handleChange}
                                className={inputClass}
                                required
                              />
                            </div>
                            <div>
                              <label className={labelClass}>Apellidos *</label>
                              <input
                                type="text"
                                name="lastName"
                                value={form.lastName}
                                onChange={handleChange}
                                className={inputClass}
                                required
                              />
                            </div>
                            <div>
                              <label className={labelClass}>
                                Fecha de Nacimiento *
                              </label>
                              <input
                                type="date"
                                name="birthdate"
                                value={form.birthdate}
                                onChange={handleChange}
                                className={inputClass}
                                required
                              />
                            </div>
                            <div>
                              <label className={labelClass}>Género *</label>
                              <select
                                name="gender"
                                value={form.gender}
                                onChange={handleChange}
                                className={inputClass}
                                required
                              >
                                <option value="">Seleccione</option>
                                <option value="M">Masculino</option>
                                <option value="F">Femenino</option>
                              </select>
                            </div>
                            <div>
                              <label className={labelClass}>
                                Email (Acceso) *
                              </label>
                              <input
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                className={inputClass}
                                required
                              />
                            </div>
                            <div>
                              <label className={labelClass}>
                                Contraseña *
                              </label>
                              <input
                                type="password"
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                className={inputClass}
                                required
                              />
                            </div>
                            <div>
                              <label className={labelClass}>Estado *</label>
                              <select
                                name="patientStatus"
                                value={form.patientStatus}
                                onChange={handleChange}
                                className={inputClass}
                                required
                              >
                                <option value="activo">Activo</option>
                                <option value="inactivo">Inactivo</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* PASO 2: INFORMACIÓN ADICIONAL */}
                      {step === 2 && (
                        <div>
                          <h2 className={sectionTitleClass}>
                            Información Adicional (Paso 2 de 3)
                          </h2>
                          <div className="grid md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className={labelClass}>
                                Ciudad de nacimiento
                              </label>
                              <input
                                type="text"
                                name="birthCity"
                                value={form.birthCity}
                                onChange={handleChange}
                                className={inputClass}
                              />
                            </div>
                            <div>
                              <label className={labelClass}>
                                Nacionalidad
                              </label>
                              <input
                                type="text"
                                name="nationality"
                                value={form.nationality}
                                onChange={handleChange}
                                className={inputClass}
                              />
                            </div>
                            <div>
                              <label className={labelClass}>
                                Estado de nacimiento
                              </label>
                              <input
                                type="text"
                                name="birthState"
                                value={form.birthState}
                                onChange={handleChange}
                                className={inputClass}
                              />
                            </div>
                            <div>
                              <label className={labelClass}>CURP *</label>
                              <input
                                type="text"
                                name="idType"
                                value={form.idType}
                                onChange={handleChange}
                                className={inputClass}
                                placeholder="18 caracteres"
                                required
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* PASO 3: CONTACTOS Y CONSENTIMIENTO */}
                      {step === 3 && (
                        <div>
                          <h2 className={sectionTitleClass}>
                            Contactos de Emergencia (Paso 3 de 3)
                          </h2>
                          {form.contacts.map((contact, index) => (
                            <div
                              key={index}
                              className="mb-6 border border-gray-200 p-4 rounded-xl bg-gray-50 shadow-sm relative"
                            >
                              <h3 className="font-bold text-gray-700 mb-3">
                                Contacto #{index + 1}
                              </h3>
                              <div className="grid md:grid-cols-3 gap-3 mb-3">
                                <div>
                                  <label className="text-xs text-gray-500">
                                    Nombre *
                                  </label>
                                  <input
                                    type="text"
                                    name="firstName"
                                    value={contact.firstName}
                                    onChange={(e) =>
                                      handleRegisterContactChange(index, e)
                                    }
                                    className={inputClass}
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-gray-500">
                                    Apellido P. *
                                  </label>
                                  <input
                                    type="text"
                                    name="lastName"
                                    value={contact.lastName}
                                    onChange={(e) =>
                                      handleRegisterContactChange(index, e)
                                    }
                                    className={inputClass}
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-gray-500">
                                    Apellido M.
                                  </label>
                                  <input
                                    type="text"
                                    name="middleName"
                                    value={contact.middleName}
                                    onChange={(e) =>
                                      handleRegisterContactChange(index, e)
                                    }
                                    className={inputClass}
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-gray-500">
                                    Teléfono *
                                  </label>
                                  <input
                                    type="text"
                                    name="phone"
                                    value={contact.phone}
                                    onChange={(e) =>
                                      handleRegisterContactChange(index, e)
                                    }
                                    className={inputClass}
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-gray-500">
                                    Email
                                  </label>
                                  <input
                                    type="email"
                                    name="email"
                                    value={contact.email}
                                    onChange={(e) =>
                                      handleRegisterContactChange(index, e)
                                    }
                                    className={inputClass}
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-gray-500">
                                    Tel. Adicional
                                  </label>
                                  <input
                                    type="text"
                                    name="additionalPhone"
                                    value={contact.additionalPhone}
                                    onChange={(e) =>
                                      handleRegisterContactChange(index, e)
                                    }
                                    className={inputClass}
                                  />
                                </div>
                              </div>

                              <div className="grid md:grid-cols-4 gap-3 mb-3 bg-white p-3 rounded border">
                                <div className="md:col-span-2">
                                  <input
                                    type="text"
                                    name="street"
                                    placeholder="Calle"
                                    value={contact.street}
                                    onChange={(e) =>
                                      handleRegisterContactChange(index, e)
                                    }
                                    className="w-full text-sm border-b focus:outline-none p-1"
                                  />
                                </div>
                                <div>
                                  <input
                                    type="text"
                                    name="number"
                                    placeholder="Número"
                                    value={contact.number}
                                    onChange={(e) =>
                                      handleRegisterContactChange(index, e)
                                    }
                                    className="w-full text-sm border-b focus:outline-none p-1"
                                  />
                                </div>
                                <div>
                                  <input
                                    type="text"
                                    name="postalCode"
                                    placeholder="CP"
                                    value={contact.postalCode}
                                    onChange={(e) =>
                                      handleRegisterContactChange(index, e)
                                    }
                                    className="w-full text-sm border-b focus:outline-none p-1"
                                  />
                                </div>
                                <div>
                                  <input
                                    type="text"
                                    name="neighborhood"
                                    placeholder="Colonia"
                                    value={contact.neighborhood}
                                    onChange={(e) =>
                                      handleRegisterContactChange(index, e)
                                    }
                                    className="w-full text-sm border-b focus:outline-none p-1"
                                  />
                                </div>
                                <div>
                                  <input
                                    type="text"
                                    name="city"
                                    placeholder="Ciudad"
                                    value={contact.city}
                                    onChange={(e) =>
                                      handleRegisterContactChange(index, e)
                                    }
                                    className="w-full text-sm border-b focus:outline-none p-1"
                                  />
                                </div>
                                <div>
                                  <input
                                    type="text"
                                    name="state"
                                    placeholder="Estado"
                                    value={contact.state}
                                    onChange={(e) =>
                                      handleRegisterContactChange(index, e)
                                    }
                                    className="w-full text-sm border-b focus:outline-none p-1"
                                  />
                                </div>
                                <div>
                                  <input
                                    type="text"
                                    name="country"
                                    placeholder="País"
                                    value={contact.country}
                                    onChange={(e) =>
                                      handleRegisterContactChange(index, e)
                                    }
                                    className="w-full text-sm border-b focus:outline-none p-1"
                                  />
                                </div>
                              </div>

                              <label className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                                <input
                                  type="checkbox"
                                  name="sendReminders"
                                  checked={contact.sendReminders}
                                  onChange={(e) =>
                                    handleRegisterContactChange(index, e)
                                  }
                                  className="rounded text-indigo-600 focus:ring-indigo-500"
                                />
                                <span>
                                  Enviar recordatorios a este contacto
                                </span>
                              </label>

                              {form.contacts.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeContact(index)}
                                  className="text-red-500 text-sm hover:underline absolute top-4 right-4"
                                >
                                  Eliminar
                                </button>
                              )}
                            </div>
                          ))}

                          <button
                            type="button"
                            onClick={addContact}
                            className="mb-6 text-indigo-600 font-medium hover:text-indigo-800 flex items-center"
                          >
                            + Añadir otro contacto
                          </button>

                          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                name="consent"
                                checked={form.consent}
                                onChange={handleChange}
                                className="h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
                                required
                              />
                              <span className="ml-3 text-sm text-gray-700">
                                Acepto el consentimiento para el tratamiento de
                                mis datos personales.
                              </span>
                            </label>
                          </div>
                        </div>
                      )}

                      {/* Botones de Navegación Paciente */}
                      <div className="flex justify-between mt-6">
                        {step > 1 && (
                          <button
                            type="button"
                            onClick={handlePrevStep}
                            className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition"
                          >
                            Anterior
                          </button>
                        )}
                        {step < 3 ? (
                          <button
                            type="button"
                            onClick={handleNextStep}
                            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition ml-auto"
                          >
                            Siguiente
                          </button>
                        ) : (
                          <button
                            type="submit"
                            disabled={loading}
                            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition ml-auto flex items-center"
                          >
                            {loading ? "Registrando..." : "Registrar Paciente"}
                          </button>
                        )}
                      </div>
                    </>
                  )}

                  {/* ======================= ROL: TERAPEUTA ======================= */}
                  {role === "therapist" && (
                    <>
                      <h2 className={sectionTitleClass}>Datos del Terapeuta</h2>
                      {step === 1 && (
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className={labelClass}>Nombre *</label>
                            <input
                              type="text"
                              name="firstName"
                              value={form.firstName}
                              onChange={handleChange}
                              className={inputClass}
                              required
                            />
                          </div>
                          <div>
                            <label className={labelClass}>Apellidos *</label>
                            <input
                              type="text"
                              name="lastName"
                              value={form.lastName}
                              onChange={handleChange}
                              className={inputClass}
                              required
                            />
                          </div>
                          <div>
                            <label className={labelClass}>Email *</label>
                            <input
                              type="email"
                              name="email"
                              value={form.email}
                              onChange={handleChange}
                              className={inputClass}
                              required
                            />
                          </div>
                          <div>
                            <label className={labelClass}>Contraseña *</label>
                            <input
                              type="password"
                              name="password"
                              value={form.password}
                              onChange={handleChange}
                              className={inputClass}
                              required
                            />
                          </div>
                          <div>
                            <label className={labelClass}>Teléfono *</label>
                            <input
                              type="text"
                              name="phone"
                              value={form.phone}
                              onChange={handleChange}
                              className={inputClass}
                              required
                            />
                          </div>
                          <div>
                            <label className={labelClass}>Especialización</label>
                            <input
                              type="text"
                              name="specialization"
                              value={form.specialization}
                              onChange={handleChange}
                              className={inputClass}
                            />
                          </div>
                        </div>
                      )}
                      {step === 2 && (
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className={labelClass}>Dirección</label>
                            <input
                              type="text"
                              name="address"
                              value={form.address}
                              onChange={handleChange}
                              className={inputClass}
                            />
                          </div>
                          <div>
                            <label className={labelClass}>Ciudad</label>
                            <input
                              type="text"
                              name="city"
                              value={form.city}
                              onChange={handleChange}
                              className={inputClass}
                            />
                          </div>
                          <div>
                            <label className={labelClass}>País</label>
                            <input
                              type="text"
                              name="country"
                              value={form.country}
                              onChange={handleChange}
                              className={inputClass}
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between mt-6">
                        {step === 2 && (
                          <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="bg-gray-500 text-white px-6 py-2 rounded-lg"
                          >
                            Anterior
                          </button>
                        )}
                        {step === 1 && (
                          <button
                            type="button"
                            onClick={() => setStep(2)}
                            className="bg-indigo-600 text-white px-6 py-2 rounded-lg ml-auto"
                          >
                            Siguiente
                          </button>
                        )}
                        {step === 2 && (
                          <button
                            type="submit"
                            disabled={loading}
                            className="bg-green-600 text-white px-6 py-2 rounded-lg ml-auto"
                          >
                            {loading ? "..." : "Registrar Terapeuta"}
                          </button>
                        )}
                      </div>
                    </>
                  )}

                  {/* ======================= ROL: ADMIN / OPERADOR ======================= */}
                  {(role === "admin" || role === "operador") && (
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                      <h2 className={sectionTitleClass}>
                        Datos de Acceso Administrativo
                      </h2>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className={labelClass}>
                            Email de Acceso *
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            className={inputClass}
                            required
                          />
                        </div>
                        <div>
                          <label className={labelClass}>
                            {isEditing
                              ? "Nueva Contraseña (Opcional)"
                              : "Contraseña *"}
                          </label>
                          <input
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            className={inputClass}
                            placeholder={
                              isEditing
                                ? "Dejar vacío para no cambiar"
                                : "Mínimo 6 caracteres"
                            }
                            required={!isEditing}
                          />
                        </div>
                      </div>

                      <div className="mt-8 flex justify-end">
                        <button
                          type="submit"
                          disabled={loading}
                          className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg"
                        >
                          {loading
                            ? "Procesando..."
                            : isEditing
                            ? "Actualizar Usuario"
                            : "Registrar Usuario"}
                        </button>
                      </div>
                    </div>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDICIÓN PACIENTE */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-fadeIn">
            {/* Header Fijo */}
            <div className="sticky top-0 bg-indigo-700 p-6 text-white flex justify-between items-center z-10">
              <div>
                <h3 className="text-2xl font-bold">
                  {isViewMode
                    ? "Visualización de Paciente"
                    : "Edición Integral de Paciente"}
                </h3>
                <p className="text-indigo-100 opacity-80">
                  Modificando perfil de {editForm.firstName}
                </p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-white text-2xl"
              >
                &times;
              </button>
            </div>

            {isViewMode ? (
              renderUserDetailsView()
            ) : (
            <form onSubmit={guardarCambios} className="p-8 space-y-8">
              <fieldset disabled={isViewMode}>
                <section className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                  <h4 className="text-gray-700 font-bold mb-4 flex items-center">
                    🔑 Credenciales de Cuenta
                  </h4>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase">
                        Correo Electrónico
                      </label>
                      <input
                        type="email"
                        className="w-full p-2 border-b-2 border-gray-300 focus:border-blue-500 outline-none transition bg-transparent"
                        value={editForm.email || ""}
                        onChange={(e) =>
                          setEditForm({ ...editForm, email: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase">
                        Nueva Contraseña (Opcional)
                      </label>
                      <input
                        type="password"
                        placeholder="Dejar en blanco para no cambiar"
                        className="w-full p-2 border-b-2 border-gray-300 focus:border-blue-500 outline-none transition bg-transparent"
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            password: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </section>

                {/* SECCIÓN 1: DATOS PERSONALES */}
                <section>
                  <h4 className="text-indigo-600 font-bold border-b pb-2 mb-4">
                    1. Identificación y Estado
                  </h4>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-500">
                        Nombre
                      </label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={editForm.firstName}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            firstName: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500">
                        Apellidos
                      </label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={editForm.lastName}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            lastName: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500">
                        CURP
                      </label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded uppercase"
                        value={editForm.idType}
                        onChange={(e) =>
                          setEditForm({ ...editForm, idType: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500">
                        Estado del Paciente
                      </label>
                      <select
                        className="w-full p-2 border rounded"
                        value={editForm.patientStatus}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            patientStatus: e.target.value,
                          })
                        }
                      >
                        <option value="activo">Activo</option>
                        <option value="inactivo">Inactivo</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500">
                        Género
                      </label>
                      <select
                        className="w-full p-2 border rounded"
                        value={editForm.gender}
                        onChange={(e) =>
                          setEditForm({ ...editForm, gender: e.target.value })
                        }
                      >
                        <option value="M">Masculino</option>
                        <option value="F">Femenino</option>
                      </select>
                    </div>
                  </div>
                </section>

                {/* SECCIÓN 2: LUGAR Y FECHA */}
                <section>
                  <h4 className="text-indigo-600 font-bold border-b pb-2 mb-4">
                    2. Nacimiento y Nacionalidad
                  </h4>
                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                      <label className="text-xs font-bold text-gray-500">
                        Ciudad de Nacimiento
                      </label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={editForm.birthCity}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            birthCity: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500">
                        Estado
                      </label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={editForm.birthState}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            birthState: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500">
                        Nacionalidad
                      </label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={editForm.nationality}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            nationality: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </section>

                {/* SECCIÓN 3: CONTACTOS DE EMERGENCIA */}
                <section className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="text-indigo-600 font-bold flex items-center">
                      <span className="mr-2">🚨</span> 3. Contactos de
                      Emergencia
                    </h4>
                    <button
                      type="button"
                      onClick={agregarContacto}
                      className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition flex items-center shadow-sm"
                    >
                      + Añadir Contacto
                    </button>
                  </div>

                  <div className="space-y-4">
                    {editForm.contacts?.map((contact, index) => (
                      <div
                        key={index}
                        className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative mb-6"
                      >
                        <div className="flex justify-between items-center mb-4">
                          <p className="font-bold text-indigo-900">
                            Contacto #{index + 1}
                          </p>
                          <button
                            type="button"
                            onClick={() => eliminarContacto(index)}
                            className="text-red-400 hover:text-red-600"
                          >
                            Eliminar
                          </button>
                        </div>

                        {/* FILA 1: NOMBRES */}
                        <div className="grid md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">
                              Nombre *
                            </label>
                            <input
                              type="text"
                              name="firstName"
                              className="w-full p-2 bg-blue-50/50 border border-blue-100 rounded-lg"
                              value={contact.firstName || ""}
                              onChange={(e) =>
                                handleEditContactChange(index, e)
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">
                              Apellido P. *
                            </label>
                            <input
                              type="text"
                              className="w-full p-2 bg-blue-50/50 border border-blue-100 rounded-lg"
                              value={contact.lastName}
                              onChange={(e) =>
                                handleEditContactChange(index, {
                                  target: {
                                    name: "lastName",
                                    value: e.target.value,
                                  },
                                })
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">
                              Apellido M.
                            </label>
                            <input
                              type="text"
                              className="w-full p-2 bg-blue-50/50 border border-blue-100 rounded-lg"
                              value={contact.middleName || ""}
                              onChange={(e) =>
                                handleEditContactChange(index, {
                                  target: {
                                    name: "middleName",
                                    value: e.target.value,
                                  },
                                })
                              }
                            />
                          </div>
                        </div>

                        {/* FILA 2: CONTACTO */}
                        <div className="grid md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">
                              Teléfono *
                            </label>
                            <input
                              type="text"
                              className="w-full p-2 bg-blue-50/50 border border-blue-100 rounded-lg"
                              value={contact.phone}
                              onChange={(e) =>
                                handleEditContactChange(index, {
                                  target: {
                                    name: "phone",
                                    value: e.target.value,
                                  },
                                })
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">
                              Email
                            </label>
                            <input
                              type="email"
                              className="w-full p-2 bg-blue-50/50 border border-blue-100 rounded-lg"
                              value={contact.email}
                              onChange={(e) =>
                                handleEditContactChange(index, {
                                  target: {
                                    name: "email",
                                    value: e.target.value,
                                  },
                                })
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">
                              Tel. Adicional
                            </label>
                            <input
                              type="text"
                              className="w-full p-2 bg-blue-50/50 border border-blue-100 rounded-lg"
                              value={contact.additionalPhone}
                              onChange={(e) =>
                                handleEditContactChange(index, {
                                  target: {
                                    name: "additionalPhone",
                                    value: e.target.value,
                                  },
                                })
                              }
                            />
                          </div>
                        </div>

                        {/* FILA 3: DIRECCIÓN */}
                        <div className="grid grid-cols-12 gap-2 mb-2">
                          <input
                            placeholder="Calle/Avenida"
                            className="col-span-6 p-2 bg-blue-50/50 border border-blue-100 rounded-lg text-sm"
                            value={contact.street}
                            onChange={(e) =>
                              handleEditContactChange(index, {
                                target: {
                                  name: "street",
                                  value: e.target.value,
                                },
                              })
                            }
                          />
                          <input
                            placeholder="N. Exterior"
                            className="col-span-2 p-2 bg-blue-50/50 border border-blue-100 rounded-lg text-sm"
                            value={contact.houseNumber}
                            onChange={(e) =>
                              handleEditContactChange(index, {
                                target: {
                                  name: "houseNumber",
                                  value: e.target.value,
                                },
                              })
                            }
                          />
                          <input
                            placeholder="C.P."
                            className="col-span-4 p-2 bg-blue-50/50 border border-blue-100 rounded-lg text-sm"
                            value={contact.zipCode}
                            onChange={(e) =>
                              handleEditContactChange(index, {
                                target: {
                                  name: "zipCode",
                                  value: e.target.value,
                                },
                              })
                            }
                          />
                        </div>

                        {/* FILA 4: DIRECCIÓN (Línea inferior) */}
                        <div className="grid grid-cols-4 gap-2 mb-4">
                          <input
                            placeholder="Colonia"
                            className="p-2 bg-blue-50/50 border border-blue-100 rounded-lg text-sm"
                            value={contact.neighborhood}
                            onChange={(e) =>
                              handleEditContactChange(index, {
                                target: {
                                  name: "neighborhood",
                                  value: e.target.value,
                                },
                              })
                            }
                          />
                          <input
                            placeholder="Ciudad"
                            className="p-2 bg-blue-50/50 border border-blue-100 rounded-lg text-sm"
                            value={contact.city}
                            onChange={(e) =>
                              handleEditContactChange(index, {
                                target: {
                                  name: "city",
                                  value: e.target.value,
                                },
                              })
                            }
                          />
                          <input
                            placeholder="Estado"
                            className="p-2 bg-blue-50/50 border border-blue-100 rounded-lg text-sm"
                            value={contact.state}
                            onChange={(e) =>
                              handleEditContactChange(index, {
                                target: {
                                  name: "state",
                                  value: e.target.value,
                                },
                              })
                            }
                          />
                          <input
                            placeholder="País"
                            className="p-2 bg-blue-50/50 border border-blue-100 rounded-lg text-sm"
                            value={contact.country}
                            onChange={(e) =>
                              handleEditContactChange(index, {
                                target: {
                                  name: "country",
                                  value: e.target.value,
                                },
                              })
                            }
                          />
                        </div>

                        {/* CHECKBOX RECORDATORIOS */}
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            checked={contact.sendRecordatorios}
                            onChange={(e) =>
                              handleEditContactChange(index, {
                                target: {
                                  name: "sendRecordatorios",
                                  value: e.target.checked,
                                },
                              })
                            }
                          />
                          <span className="text-sm text-gray-600 font-medium">
                            Enviar recordatorios a este contacto
                          </span>
                        </div>
                      </div>
                    ))}

                    {editForm.contacts?.length === 0 && (
                      <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
                        <p className="text-gray-400 text-sm">
                          No hay contactos de emergencia registrados.
                        </p>
                      </div>
                    )}
                  </div>
                </section>

                {/* Footer con Botones */}
                <div className="flex justify-end space-x-4 sticky bottom-0 bg-white pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-6 py-2 text-gray-500 font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={
                      !editForm.contacts || editForm.contacts.length === 0
                    }
                    className={`px-10 py-2 font-bold rounded-lg shadow-lg transition ${
                      !editForm.contacts || editForm.contacts.length === 0
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-green-600 text-white hover:bg-green-700 shadow-green-200"
                    }`}
                  >
                    Actualizar Todo
                  </button>
                </div>
              </fieldset>
            </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL EDICIÓN TERAPEUTA */}
      {isEditTherapistModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-fadeIn">
            {/* Header Fijo */}
            <div className="sticky top-0 bg-emerald-700 p-6 text-white flex justify-between items-center z-10">
              <div>
                <h3 className="text-2xl font-bold">Gestión de Terapeuta</h3>
                <p className="text-emerald-100 opacity-80">
                  Modificando perfil profesional de {editForm.firstName}
                </p>
              </div>
              <button
                onClick={() => setIsEditTherapistModalOpen(false)}
                className="text-white text-2xl"
              >
                &times;
              </button>
            </div>

            {isViewMode ? (
              renderUserDetailsView()
            ) : (
            <form onSubmit={guardarCambios} className="p-8 space-y-8">
              <fieldset disabled={isViewMode}>
                {/* SECCIÓN CREDENCIALES */}
                <section className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                  <h4 className="text-gray-700 font-bold mb-4 flex items-center">
                    🔑 Cuenta de Acceso
                  </h4>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase">
                        Correo Institucional
                      </label>
                      <input
                        type="email"
                        className="w-full p-2 border-b-2 border-gray-300 focus:border-emerald-500 outline-none bg-transparent"
                        value={editForm.email || ""}
                        onChange={(e) =>
                          setEditForm({ ...editForm, email: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase">
                        Cambiar Contraseña
                      </label>
                      <input
                        type="password"
                        placeholder="Solo si desea actualizar"
                        className="w-full p-2 border-b-2 border-gray-300 focus:border-emerald-500 outline-none bg-transparent"
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            password: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </section>

                {/* SECCIÓN PROFESIONAL */}
                <section>
                  <h4 className="text-emerald-600 font-bold border-b pb-2 mb-4">
                    🩺 Datos Profesionales
                  </h4>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-500">
                        Nombre(s)
                      </label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={editForm.firstName}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            firstName: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500">
                        Apellidos
                      </label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={editForm.lastName}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            lastName: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500">
                        Especialidad
                      </label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={editForm.specialization}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            specialization: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500">
                        Teléfono de Contacto
                      </label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={editForm.phone}
                        onChange={(e) =>
                          setEditForm({ ...editForm, phone: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500">
                        Direccion
                      </label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={editForm.address}
                        onChange={(e) =>
                          setEditForm({ ...editForm, address: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500">
                        Ciudad
                      </label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={editForm.city}
                        onChange={(e) =>
                          setEditForm({ ...editForm, city: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500">
                        Pais
                      </label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={editForm.country}
                        onChange={(e) =>
                          setEditForm({ ...editForm, country: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </section>

                {/* Footer con Botones */}
                <div className="flex justify-end space-x-4 sticky bottom-0 bg-white pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setIsEditTherapistModalOpen(false)}
                    className="px-6 py-2 text-gray-400"
                  >
                    Descartar
                  </button>
                  <button
                    type="submit"
                    className="px-10 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition"
                  >
                    Guardar Cambios Profesional
                  </button>
                </div>
              </fieldset>
            </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL EDICIÓN ADMIN */}
      {isEditAdminModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl animate-fadeIn">
            {/* Header */}
            <div className="bg-slate-800 p-6 text-white rounded-t-2xl flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">
                  Gestión de Personal Administrativo
                </h3>
                <p className="text-slate-300 text-sm">
                  Configurando accesos para {editForm.email}
                </p>
              </div>
              <button
                onClick={() => setIsEditAdminModalOpen(false)}
                className="text-white text-2xl"
              >
                &times;
              </button>
            </div>

            {isViewMode ? (
              renderUserDetailsView()
            ) : (
            <form onSubmit={guardarCambios} className="p-8 space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    className="w-full p-3 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-slate-500 outline-none"
                    value={editForm.email || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, email: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                    Nivel de Acceso (Rol)
                  </label>
                  <select
                    className="w-full p-3 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-slate-500 outline-none"
                    value={editForm.role}
                    onChange={(e) =>
                      setEditForm({ ...editForm, role: e.target.value })
                    }
                  >
                    <option value="admin">Administrador (Acceso Total)</option>
                    <option value="operador">Operador (Acceso Limitado)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                    Restablecer Contraseña
                  </label>
                  <input
                    type="password"
                    placeholder="Dejar en blanco para mantener actual"
                    className="w-full p-3 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-slate-500 outline-none"
                    onChange={(e) =>
                      setEditForm({ ...editForm, password: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => setIsEditAdminModalOpen(false)}
                  className="px-6 py-2 text-gray-500"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  className="px-8 py-2 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-900 transition shadow-lg"
                >
                  Actualizar Permisos
                </button>
              </div>
            </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}