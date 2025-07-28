"use client";
import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

const socket = io("http://localhost:3001");

const Mensajes = () => {
  const { userId, userName } = useAuth();
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [receptor, setReceptor] = useState("");
  const [therapists, setTherapists] = useState([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    const fetchTherapists = async () => {
      try {
        const res = await axios.get("/api/therapist");
        setTherapists(res.data.therapist || []);
      } catch (error) {
        console.error("Error al cargar terapeutas:", error);
      }
    };
    fetchTherapists();
  }, []);

  useEffect(() => {
    if (!userId) return;

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit("registrar", userId);
    console.log("✅ Registrado:", userId);

    const recibirMensaje = (mensaje) => {
      if (
        (mensaje.from === userId || mensaje.to === userId) &&
        !mensajes.some(m => m.timestamp === mensaje.timestamp && m.content === mensaje.content)
      ) {
        setMensajes((prev) => [...prev, mensaje]);
      }
    };

    socket.on("mensaje", recibirMensaje);

    return () => {
      socket.off("mensaje", recibirMensaje);
    };
  }, [userId, mensajes]);

  useEffect(() => {
    const fetchMensajes = async () => {
      if (!userId) return
      try {
        const res = await axios.get(`/api/messages?userId=${userId}`)
        setMensajes(res.data.messages || [])
      } catch (error) {
        console.error("Error al cargar historial de mensajjes:", error)
      }
    }

    fetchMensajes()
  }, [userId])

  const enviarMensaje = () => {
    if (nuevoMensaje.trim() && receptor.trim()) {
      const mensaje = {
        from: userId,
        fromName: userName,
        to: receptor,
        content: nuevoMensaje,
        timestamp: new Date().toISOString(),
      };
      socket.emit("mensaje", mensaje);
      setNuevoMensaje("");
    }
  };

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth"})
  }, [mensajes])

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4 text-white">Chat - {userName}</h2>

      <div className="mb-4">
        <label className="block text-white mb-1">Selecciona un terapeuta</label>
        <select
          value={receptor}
          onChange={(e) => setReceptor(e.target.value)}
          className="w-full p-2 border rounded text-black"
        >
          <option value="">-- Selecciona --</option>
          {therapists.map((therapist) => (
            <option key={therapist._id} value={therapist._id}>
              {therapist.firstName} {therapist.lastName}
            </option>
          ))}
        </select>
      </div>

      <div className="border p-4 h-64 overflow-y-scroll mb-4 bg-white text-black">
        {mensajes.map((msg, idx) => (
          <div key={idx} className="mb-2">
            <strong>
              {msg.from === userId
                ? `${userName} (Tú)`
                : msg.fromName || "Otro"}
              :
            </strong>{" "}
            {msg.content}
          </div>
        ))}
        <div ref={scrollRef}/>
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
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Enviar
        </button>
      </div>
    </div>
  );
};

export default Mensajes;
