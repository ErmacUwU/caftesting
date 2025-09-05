import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Patient from "@/models/Patient";

export async function PATCH(request, { params }) {
  const { id } = params; // 📌 ID del paciente en la URL
  const { cantidad, metodoPago } = await request.json(); // 📌 Datos del pago recibidos

  try {
    await dbConnect();

    // 📌 Buscar al paciente
    const patient = await Patient.findById(id);
    if (!patient) {
      return NextResponse.json({ msg: "Paciente no encontrado" }, { status: 404 });
    }

    // 📌 Validar que `cantidad` sea mayor que 0
    if (!cantidad || cantidad <= 0) {
      return NextResponse.json({ msg: "El pago debe ser mayor a 0" }, { status: 400 });
    }

    // 📌 Verificar que el pago no sea mayor a la deuda total
    if (cantidad > patient.estadoDeCuenta.total) {
      return NextResponse.json({ msg: "El pago excede la deuda total" }, { status: 400 });
    }

    // 📌 Registrar el pago y actualizar la deuda
    patient.estadoDeCuenta.total -= cantidad;
    patient.estadoDeCuenta.pagos.push({
      fecha: new Date(),
      cantidad,
      metodoPago,
    });

    await patient.save();

    return NextResponse.json({
      msg: "Pago registrado correctamente",
      estadoDeCuenta: patient.estadoDeCuenta,
    }, { status: 200 });

  } catch (error) {
    console.error("Error al registrar el pago:", error);
    return NextResponse.json({ msg: "Error al registrar el pago" }, { status: 500 });
  }
}
