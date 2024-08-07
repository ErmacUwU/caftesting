import dbConnect from "@/lib/dbConnect";
import Patient from "@/models/Patient";
import mongoose from "mongoose";
import { NextResponse } from "next/server";

export async function POST(req) {
  const {
    idPatient,
    firstName,
    lastName,
    birthdate,
    gender,
    patientStatus,
    birthCity,
    nationality,
    birthState,
    idType,
    contacts,
  } = await req.json();

  try {
    await dbConnect();
    await Patient.create({
      idPatient,
      firstName,
      lastName,
      birthdate,
      gender,
      patientStatus,
      birthCity,
      nationality,
      birthState,
      idType,
      contacts,
      estadoDeCuenta: {
        total: 0,
        pagos: []
      }
    });

    return NextResponse.json({
      msg: ["Mensaje enviado con exito"],
      success: true
    });
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      let errorList = [];
      for (let e in error.errors) {
        errorList.push(error.errors[e].message);
      }

      return NextResponse.json({ msg: errorList });
    } else {
      return NextResponse.json({ msg: "No se envio" });
    }
  }
}

export async function GET() {
  await dbConnect();
  const patients = await Patient.find();
  return NextResponse.json({ patients });
}

export async function DELETE(req) {
  const id = req.nextUrl.searchParams.get("id");
  await dbConnect();
  await Patient.findByIdAndDelete(id);
  return NextResponse.json({ msg: "Paciente Eliminado" });
}

export async function PATCH(req) {
  const { pacienteId, cantidad } = await req.json();

  try {
    await dbConnect();
    const paciente = await Patient.findById(pacienteId);

    if (!paciente) {
      return NextResponse.json({
        msg: "Paciente no encontrado",
        success: false,
      });
    }

    const nuevoPago = {
      fecha: new Date(),
      cantidad,
    };

    // Asegúrate de sumar la cantidad al total
    paciente.estadoDeCuenta.total += cantidad;
    paciente.estadoDeCuenta.pagos.push(nuevoPago);

    await paciente.save();

    return NextResponse.json({
      msg: ["Pago registrado con éxito"],
      success: true,
      estadoDeCuenta: paciente.estadoDeCuenta,
    });
  } catch (error) {
    return NextResponse.json({
      msg: "Error al registrar el pago",
      success: false,
    });
  }
}
