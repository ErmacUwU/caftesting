import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Patient from "@/models/Patient";

export const runtime = "nodejs";

export async function PATCH(request, { params }) {
  const { id } = params;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ msg: "JSON inválido" }, { status: 400 });
  }

  const monto = Number(body?.cantidad);
  const metodoPago = body?.metodoPago;

  const metodosValidos = ["efectivo", "tarjeta", "transferencia"];
  if (!Number.isFinite(monto) || monto <= 0) {
    return NextResponse.json({ msg: "La cantidad debe ser un número > 0" }, { status: 400 });
  }
  if (!metodosValidos.includes(metodoPago)) {
    return NextResponse.json({ msg: `metodoPago inválido. Use: ${metodosValidos.join(", ")}` }, { status: 400 });
  }

  try {
    await dbConnect();

    const patient = await Patient.findById(id);
    if (!patient) {
      return NextResponse.json({ msg: "Paciente no encontrado" }, { status: 404 });
    }

    if (!patient.estadoDeCuenta) {
      patient.estadoDeCuenta = { total: 0, citas: [], pagos: [] };
    }
    if (!Array.isArray(patient.estadoDeCuenta.pagos)) patient.estadoDeCuenta.pagos = [];
    if (typeof patient.estadoDeCuenta.total !== "number") patient.estadoDeCuenta.total = 0;

    if (monto > patient.estadoDeCuenta.total) {
      return NextResponse.json({ msg: "El pago excede la deuda total" }, { status: 400 });
    }

    patient.estadoDeCuenta.total = Math.max(patient.estadoDeCuenta.total - monto, 0);
    patient.estadoDeCuenta.pagos.push({
      fecha: new Date(),
      cantidad: monto,
      metodoPago,
    });

    await patient.save();

    return NextResponse.json(
      { msg: "Pago registrado correctamente", estadoDeCuenta: patient.estadoDeCuenta },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error al registrar el pago:", err);
    return NextResponse.json(
      { msg: "Error al registrar el pago", detail: String(err?.message || err) },
      { status: 500 }
    );
  }
}
