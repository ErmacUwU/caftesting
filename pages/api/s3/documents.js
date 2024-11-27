const mongoose = require("mongoose");
const File = require("../../models/File"); // Ajusta esta ruta según la ubicación de tu modelo

// Conectar a MongoDB
const connectToDatabase = async () => {
  if (mongoose.connection.readyState === 0) {
    try {
      await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log("Conectado a MongoDB");
    } catch (error) {
      console.error("Error al conectar a MongoDB:", error);
      throw new Error("Error al conectar a la base de datos");
    }
  }
};

export default async function handler(req, res) {
  await connectToDatabase();

  if (req.method === "POST") {
    const { patients, therapists } = req.body;

    try {
      // Construir la consulta dinámica
      const query = {};
      if (patients && patients.length > 0) query.patient = { $in: patients };
      if (therapists && therapists.length > 0) query.therapist = { $in: therapists };

      // Consultar los documentos que cumplen con los filtros
      const documents = await File.find(query);

      // Responder con los documentos encontrados
      return res.status(200).json({ documents });
    } catch (error) {
      console.error("Error al consultar documentos:", error);
      return res.status(500).json({ error: "Error interno del servidor." });
    }
  } else {
    // Manejar métodos no soportados
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Método ${req.method} no permitido.` });
  }
}
