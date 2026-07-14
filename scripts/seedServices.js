import mongoose from "mongoose";

import dbConnect from "../lib/dbConnect.js";
import Service from "../models/Service.js";

import services from "./utils/services.js";

async function seedServices() {
  try {
    console.log("🚀 Iniciando Seeder de Servicios...");

    await dbConnect();

    console.log("✅ Conectado a MongoDB");

    await Service.deleteMany({});

    console.log("🗑 Servicios anteriores eliminados");

    const inserted = await Service.insertMany(services);

    console.log(`✅ ${inserted.length} servicios creados`);
  } catch (err) {
    console.error("❌ Error creando servicios");
    console.error(err);
  } finally {
    await mongoose.disconnect();

    console.log("🔌 Conexión cerrada");
  }
}

seedServices();