import express from "express";
import { Server } from "socket.io";
import http from "http";
import dbConnect from "./dbConnect.js";
import Message from "../models/Message.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

await dbConnect();

const usuarios = {};

io.on("connection", (socket) => {

  socket.on("registrar", (userId) => {
    usuarios[userId] = socket.id;
  });

  socket.on("mensaje", async (msg) => {
    console.log(`Mensaje de ${msg.fromName} (${msg.from}) → ${msg.to}: ${msg.content}`);

    try {
      const nuevoMensaje = new Message(msg);
      await nuevoMensaje.save();
    } catch (err) {
      console.error("Error al guardar el mensaje:", err);
    }

    const receptorSocket = usuarios[msg.to];
    if (receptorSocket) {
      io.to(receptorSocket).emit("mensaje", msg);
    }

    socket.emit("mensaje", msg);
  });
});

server.listen(3001, () => {
  console.log("Servidor de Socket activado");
});
