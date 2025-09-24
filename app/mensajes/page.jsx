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

  const formatTime = (iso) =>
    iso ? new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }) : "";

  return (
    <div className="min-h-[80vh] bg-white">
      <div className="max-w-3xl mx-auto p-4 md:p-6">
        {/* Encabezado suave */}
        <div className="mb-4 text-center">
          <h2 className="text-2xl font-bold text-zinc-800">
            Mensajes
          </h2>
          <p className="text-xs text-zinc-500 mt-1">Sesión: {userName}</p>
        </div>

        {/* Selector receptor (simple) */}
        <div className="mb-4">
          <label className="block text-sm text-zinc-600 mb-1">{labelTexto}</label>
          <select
            value={receptor}
            onChange={(e) => setReceptor(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-zinc-800 outline-none focus:ring-2 focus:ring-sky-300"
          >
            <option value="">— Selecciona —</option>
            {usuarios.map((usuario) => (
              <option key={usuario._id} value={usuario._id}>
                {usuario.firstName} {usuario.lastName}
              </option>
            ))}
          </select>
        </div>

        {/* Caja de chat estilo amable */}
        <div className="rounded-2xl bg-white border border-zinc-200 shadow-[0_6px_18px_rgba(0,0,0,0.06)]">
          {/* Header chat con avatar inicial */}
          <div className="px-4 py-3 border-b border-zinc-200 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-sky-300/70 text-white grid place-items-center">
              {(usuarioSeleccionado?.firstName?.[0] || "U").toUpperCase()}
            </div>
            <div>
              <div className="font-medium text-zinc-800">
                {receptor ? nombreReceptor : "Sin conversación"}
              </div>
              <div className="text-xs text-zinc-500">Chat 1 a 1</div>
            </div>
          </div>

          {/* Lista de mensajes con burbujas pastel */}
          <div className="px-3 md:px-4 py-4 h-[420px] overflow-y-auto">
            {!receptor ? (
              <div className="h-full grid place-items-center text-sm text-zinc-500">
                Elige a un usuario para iniciar conversación
              </div>
            ) : mensajes.length === 0 ? (
              <div className="h-full grid place-items-center text-sm text-zinc-500">
                No hay mensajes todavía.
              </div>
            ) : (
              <ul className="space-y-2">
                {mensajes.map((msg, idx) => {
                  const isMine = msg.from === userId;
                  return (
                    <li key={idx} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[75%] px-3 py-2 rounded-2xl text-[15px] leading-snug
                          shadow-[0_3px_10px_rgba(0,0,0,0.06)]
                          ${isMine
                            ? "bg-sky-200 text-zinc-800 rounded-br-sm"
                            : "bg-pink-100 text-zinc-800 rounded-bl-sm"}`}
                      >
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[11px] text-zinc-600">
                            {isMine ? `${userName} (tú)` : msg.fromName || "Usuario"}
                          </span>
                          <span className="text-[10px] text-zinc-400">{formatTime(msg.timestamp)}</span>
                        </div>
                        <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                      </div>
                    </li>
                  );
                })}
                <div ref={scrollRef} />
              </ul>
            )}
          </div>
          <div className="px-3 md:px-4 py-3 border-t border-zinc-200">
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-sky-300 placeholder:text-zinc-400"
                value={nuevoMensaje}
                onChange={(e) => setNuevoMensaje(e.target.value)}
                placeholder={receptor ? "Aa" : "Selecciona un usuario"}
                disabled={!receptor}
              />
              <button
                onClick={enviarMensaje}
                className="px-4 py-2 rounded-xl bg-sky-400 hover:bg-sky-500 text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!receptor || !nuevoMensaje.trim()}
              >
                Enviar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Mensajes;
