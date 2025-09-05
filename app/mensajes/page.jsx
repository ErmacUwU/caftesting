"use client";
import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:3001", {
  autoConnect: false,
});

const Mensajes = () => {
  const { userId, userName, userRole: role } = useAuth();
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [receptor, setReceptor] = useState("");
  const [usuarios, setUsuarios] = useState([]);
  const scrollRef = useRef(null);


  // Cargar lista dinámica (select) según rol
  useEffect(() => {
    const fetchUsuarios = async () => {
      try {

        const endpoint = role === "patient" ? "/api/therapist" : "/api/patient";
        const res = await axios.get(endpoint);

        const list =
          role === "patient" ? res.data?.therapist || [] : res.data?.patient || [];

        setUsuarios(list);
        setReceptor("");
        setMensajes([]);
      } catch (error) {
        console.error("Error al cargar usuarios:", error);
        setUsuarios([]);
      }
    };
    fetchUsuarios();
  }, [role]);

  // Registrar en socket y escucha mensajes
  useEffect(() => {
    if (!userId) return;

    if (!socket.connected) socket.connect();
    socket.emit("registrar", userId);

    const recibirMensaje = (mensaje) => {
      setMensajes((prev) => {
        const exists = prev.some(
          (m) =>
            m.timestamp === mensaje.timestamp &&
            m.content === mensaje.content &&
            m.from === mensaje.from &&
            m.to === mensaje.to
        );
        return exists ? prev : [...prev, mensaje];
      });
    };

    socket.on("mensaje", recibirMensaje);
    return () => socket.off("mensaje", recibirMensaje);
  }, [userId]);

  // Cargar historial cuando seleccionas receptor
  useEffect(() => {
    setMensajes([]);
    const fetchMensajes = async () => {
      if (!userId || !receptor) return;
      try {
        const res = await axios.get(
          `/api/messages?userId=${userId}&receptor=${receptor}`
        );
        setMensajes(res.data.messages || []);
      } catch (err) {
        console.error("Error al cargar historial de mensajes:", err);
      }
    };
    fetchMensajes();
  }, [userId, receptor]);

  const enviarMensaje = () => {
    if (!nuevoMensaje.trim() || !receptor.trim()) return;

    const mensaje = {
      from: userId,
      fromName: userName,
      to: receptor,
      content: nuevoMensaje,
      timestamp: new Date().toISOString(),
    };

    socket.emit("mensaje", mensaje);
    setNuevoMensaje("");
  };

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  const labelTexto =
    role === "patient" ? "Selecciona un terapeuta" : "Selecciona un paciente";

  const usuarioSeleccionado = usuarios.find((u) => u._id === receptor);
  const nombreReceptor = usuarioSeleccionado
    ? `${usuarioSeleccionado.firstName} ${usuarioSeleccionado.lastName}`
    : "usuario seleccionado";

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4 text-white">Chat - {userName}</h2>

      {receptor && (
        <p className="text-sm text-white mb-2">
          Conversando con: {nombreReceptor}
        </p>
      )}

      <div className="mb-4">
        <label className="block text-white mb-1">{labelTexto}</label>
        <select
          value={receptor}
          onChange={(e) => setReceptor(e.target.value)}
          className="w-full p-2 border rounded text-black"
        >
          <option value="">-- Selecciona --</option>
          {usuarios.map((usuario) => (
            <option key={usuario._id} value={usuario._id}>
              {usuario.firstName} {usuario.lastName}
            </option>
          ))}
        </select>
      </div>

      <div className="border p-4 h-64 overflow-y-scroll mb-4 bg-white text-black">
        {mensajes.map((msg, idx) => (
          <div key={idx} className="mb-2">
            <strong>
              {msg.from === userId ? `${userName} (Tú)` : msg.fromName || "Otro"}:
            </strong>{" "}
            {msg.content}
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      <div className="flex gap-2">
        <input
          className="border p-2 flex-1"
          value={nuevoMensaje}
          onChange={(e) => setNuevoMensaje(e.target.value)}
          placeholder="Escribe un mensaje"
        />
        <button
          onClick={enviarMensaje}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
          disabled={!receptor || !nuevoMensaje.trim()}
        >
          Enviar
        </button>
      </div>
    </div>
  );
};

export default Mensajes;
