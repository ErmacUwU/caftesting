import dbConnect from "@/lib/dbConnect";
import Date from "@/models/Date";
import mongoose from "mongoose";
import { NextResponse } from "next/server";

export async function POST(req) {
  const {
    idDate,
    date,
    start,
    end,
    therapist,
    patient,
    title,
    description,
    cost,
  } = await req.json();

  try {
    await dbConnect();
    await Date.create({
      idDate,
      date,
      start,
      end,
      therapist,
      patient,
      title,
      description,
      cost,
    });

    return NextResponse.json({
      msg: ["Mensaje enviado con exito"],
      success: true,
    });
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      let errorList = [];
      for (let e in error.errors) {
        errorList.push(e.message);
      }

      return NextResponse.json({ msg: errorList });
    } else {
      return NextResponse.json({ msg: "No se envio" });
    }
  }
}

export async function GET() {
  await dbConnect();
  const date = await Date.find();
  return NextResponse.json({ date });
}

export async function DELETE(req) {
  const id = req.nextUrl.searchParams.get("id");
  await dbConnect();
  await Date.findByIdAndDelete(id);
  return NextResponse.json({ msg: "Cita Eliminada" });
}
