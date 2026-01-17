'use client'

import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.js"; 
import { useRouter } from "next/navigation";
import uniquid from "uniquid";

const Usuarios = () => {
  const { isAuthenticated, isLoading, userRole } = useAuth();
  const router = useRouter();

  const [openModal, setOpenModal] = useState(false);
  const [editUser, setEditUser] = useState(null); // Para edición
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [errorLoadingUsers, setErrorLoadingUsers] = useState("");

  useEffect(() => {
  if (isLoading) return;

  if (!isAuthenticated) {
    router.replace("/login");
    return;
  }

  // 🔒 Solo ADMIN puede entrar
  if (userRole !== "admin") {
    router.replace("/403"); // o "/"
  }
}, [isAuthenticated, isLoading, userRole, router]);



  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      fetchUsers();
    }
  }, [isAuthenticated, isLoading]);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      setErrorLoadingUsers("");
      const res = await fetch("/api/userSystem");
      const data = await res.json();
      if (res.ok && data.users) {
        setUsers(data.users);
      } else {
        setErrorLoadingUsers("Error al cargar usuarios.");
      }
    } catch (error) {
      setErrorLoadingUsers("Error al cargar usuarios.");
      console.error("Error al cargar usuarios:", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = confirm("¿Seguro que quieres eliminar este usuario?");
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/userSystem?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        fetchUsers();
      } else {
        alert(data.msg?.[0] || "Error al eliminar usuario");
      }
    } catch {
      alert("Error al eliminar usuario");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Cargando...</p>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const admins = users.filter(user => user.role === "admin");
  const operadores = users.filter(user => user.role === "operador");

  return (
    <div className="min-h-screen bg-zinc-100">

      <div className="p-6 max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2">
          Usuarios del Sistema
        </h1>
        <p className="text-center text-gray-700 mb-6">
          Administración de usuarios CAF
        </p>

        <div className="flex justify-center mb-8">
          <button
            onClick={() => {
              setEditUser(null);
              setOpenModal(true);
            }}
            className="px-6 py-3 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition"
          >
            Agregar Usuario
          </button>
        </div>

        {/* Administradores */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">Administradores</h2>
          {loadingUsers ? (
            <p>Cargando...</p>
          ) : errorLoadingUsers ? (
            <p className="text-red-600">{errorLoadingUsers}</p>
          ) : admins.length === 0 ? (
            <p>No hay administradores.</p>
          ) : (
            <UserList 
              users={admins} 
              onDelete={handleDelete} 
              onEdit={user => {
                setEditUser(user);
                setOpenModal(true);
              }}
            />
          )}
        </section>

        {/* Operadores */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Operadores</h2>
          {loadingUsers ? (
            <p>Cargando...</p>
          ) : errorLoadingUsers ? (
            <p className="text-red-600">{errorLoadingUsers}</p>
          ) : operadores.length === 0 ? (
            <p>No hay operadores.</p>
          ) : (
            <UserList 
              users={operadores} 
              onDelete={handleDelete} 
              onEdit={user => {
                setEditUser(user);
                setOpenModal(true);
              }}
            />
          )}
        </section>
      </div>

      {openModal && (
        <ModalAgregarUsuario 
          onClose={() => {
            setOpenModal(false);
            fetchUsers();
          }} 
          editUser={editUser}
        />
      )}
    </div>
  );
};

const UserList = ({ users, onDelete, onEdit }) => (
  <ul className="space-y-4">
    {users.map(user => (
      <li key={user._id} className="flex items-center justify-between bg-white p-4 rounded shadow">
        <div>
          <p className="font-semibold text-lg">{user.name}</p>
          <p className="text-gray-600">{user.email}</p>
          <p className="text-sm text-gray-500 capitalize">Rol: {user.role}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(user)}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            aria-label={`Editar usuario ${user.name}`}
          >
            Editar
          </button>
          <button
            onClick={() => onDelete(user._id)}
            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition"
            aria-label={`Eliminar usuario ${user.name}`}
          >
            Eliminar
          </button>
        </div>
      </li>
    ))}
  </ul>
);


/* =========================
   MODAL AGREGAR / EDITAR USUARIO
========================= */
const ModalAgregarUsuario = ({ onClose, editUser }) => {

  const [name, setName] = useState(editUser ? editUser.name : "");
  const [email, setEmail] = useState(editUser ? editUser.email : "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(editUser ? editUser.role : "");

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const isEditMode = Boolean(editUser);

  const limpiarCampos = () => {
    setName("");
    setEmail("");
    setPassword("");
    setRole("");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !email || (!isEditMode && !password) || !role) {
      setError("Todos los campos son obligatorios");
      return;
    }

    try {
      const url = "/api/userSystem" + (isEditMode ? `?id=${editUser._id}` : "");
      const method = isEditMode ? "PUT" : "POST";

      const body = {
        idUserSystem: isEditMode ? editUser.idUserSystem : uniquid(),
        name,
        email,
        role,
      };

      // En modo edición, solo incluir password si se ingresó
      if (!isEditMode || (isEditMode && password)) {
        body.password = password;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessMessage(isEditMode ? "Usuario actualizado con éxito" : "Usuario creado con éxito");
        limpiarCampos();

        setTimeout(() => {
          setSuccessMessage("");
          onClose();
        }, 1200);
      } else {
        setError(data.msg?.[0] || data.message || "Error al guardar el usuario");
      }

    } catch (err) {
      setError("Error al guardar el usuario");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">

      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">

        <h2 className="text-2xl font-semibold mb-4">
          {isEditMode ? "Editar Usuario" : "Registrar Usuario"}
        </h2>

        {successMessage && (
          <p className="text-green-600 mb-3">{successMessage}</p>
        )}

        {error && (
          <p className="text-red-600 mb-3">{error}</p>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>

          <input
            type="text"
            placeholder="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          />

          <input
            type="email"
            placeholder="Correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          />

          <input
            type="password"
            placeholder={isEditMode ? "Nueva Contraseña (opcional)" : "Contraseña"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded px-3 py-2"
            {...(!isEditMode && { required: true })}
          />

          <select
            id="role"
            name="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          >
            <option value="">Selecciona un rol</option>
            <option value="admin">Administrador</option>
            <option value="operador">Operador</option>
          </select>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
            >
              {isEditMode ? "Actualizar" : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Usuarios;
        