const File = require("../../../models/File.js"); // Ajusta esta ruta según la ubicación de tu modelo
const mongoose = require("mongoose");

// Conectar a MongoDB si aún no está conectado
const connectToDatabase = async () => {
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
    }
};

export default async function handler(req, res) {
    await connectToDatabase();

    if (req.method === "POST") {
        const { name, type, size, key, therapist, patient, notes, images } = req.body;

        // Validar datos
        if (!name || !type || !size || !key || !therapist || !patient) {
            return res.status(400).json({ error: "Todos los campos obligatorios deben ser proporcionados." });
        }

        try {
            // Crear un registro en MongoDB
            const file = new File({ name, type, size, key, therapist, patient, notes, images });
            await file.save();

            return res.status(201).json({ message: "Archivo registrado con éxito", file });
        } catch (error) {
            console.error("Error al guardar el archivo:", error);
            return res.status(500).json({ error: "Error interno del servidor." });
        }
    } else {
        res.setHeader("Allow", ["POST"]);
        return res.status(405).json({ error: `Método ${req.method} no permitido.` });
    }
}
