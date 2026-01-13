import express from "express";
import { Server } from "socket.io";
import http from "http";
import dbConnect from "./dbConnect.js";
import Message from "../models/Message.js";

const app = express();
const server = http.createServer(app);

// Socket.io
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // frontend Next.js
    methods: ["GET", "POST"],
  },
  transports: ["websocket", "polling"], // permite WebSocket + fallback polling
});

// Conectar a DB
await dbConnect();

const usuarios = {}; // { userId: socketId }

io.on("connection", (socket) => {
  console.log("Nuevo cliente conectado:", socket.id);

  // Registrar usuario
  socket.on("registrar", (userId) => {
    usuarios[userId] = socket.id;
    console.log("Usuarios conectados:", usuarios);
  });

  // Recibir y reenviar mensaje
  socket.on("mensaje", async (msg) => {
    console.log(`Mensaje: ${msg.fromName} (${msg.from}) → ${msg.to}: ${msg.content}`);

    try {
      const nuevoMensaje = new Message(msg);
      await nuevoMensaje.save();
    } catch (err) {
      console.error("Error al guardar el mensaje:", err);
    }

    const receptorSocket = usuarios[msg.to];
    if (receptorSocket) {
      io.to(receptorSocket).emit("mensaje", msg); // enviar al receptor
    }

    socket.emit("mensaje", msg); // enviar al remitente también
  });

  // Desconexión
  socket.on("disconnect", () => {
    console.log("Cliente desconectado:", socket.id);
    for (const [userId, id] of Object.entries(usuarios)) {
      if (id === socket.id) delete usuarios[userId];
    }
  });
});

// Escuchar en el mismo puerto que el cliente espera
server.listen(3001, () => {
  console.log("Servidor de Socket.io escuchando en http://localhost:3001");
});
