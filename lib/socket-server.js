const { createServer } = require("http");
const { Server } = require("socket.io");
const express = require("express");
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log("Cliente conectado:", socket.id);

  socket.on("mensaje", (data) => {
    console.log("Mensaje recibido:", data);
    io.emit("mensaje", data);
  });

  socket.on("disconnect", () => {
    console.log("Cliente desconectado:", socket.id);
  });
});

httpServer.listen(3001, () => {
  console.log("Servidor de Socket.io funcionado: ");
});
