// pages/api/paciente/agregarPaciente.js

export default function handler(req, res) {
  if (req.method === "POST") {
    const paciente = req.body;

    // Aquí puedes agregar la lógica para guardar el paciente en la base de datos
    console.log(paciente);

    // Responder con éxito
    res.status(200).json({ message: "Paciente registrado con éxito" });
  } else {
    // Manejar otros métodos HTTP
    res.status(405).json({ message: "Método no permitido" });
  }
}
