"use client";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:3001");

const Mensajes = () => {
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");

  useEffect(() => {
    socket.on("mensaje", (mensaje) => {
      setMensajes((prev) => [...prev, mensaje]);
    });

    return () => {
      socket.off("mensaje");
    };
  }, []);

  const enviarMensaje = () => {
    if (nuevoMensaje.trim() !== "") {
      socket.emit("mensaje", nuevoMensaje);
      setNuevoMensaje("");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4 text-white">Chat básico</h2>
      <div className="border p-4 h-46 overflow-y-scroll mb-4 bg-white text-black">
        {mensajes.map((msg, idx) => (
          <div key={idx} className="mb-2">{msg}</div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="border p-2 flex-1"
          value={nuevoMensaje}
          onChange={(e) => setNuevoMensaje(e.target.value)}
          placeholder="Escribe un mensaje"
        />
        <button onClick={enviarMensaje} className="bg-blue-500 text-white px-4 py-2 rounded">
          Enviar
        </button>
      </div>
    </div>
  );
};

export default Mensajes;
