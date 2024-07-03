import dbConnect from "@/lib/dbConnect";
import Therapist from "@/models/Therapist";
import mongoose from "mongoose";
import { NextResponse } from "next/server";

export async function POST(req) {
  const {
    idTherapist,
    firstName,
    lastName,
    email,
    phone,
    specialization,
    address,
    city,
    country,
  } = await req.json();

  try {
    await dbConnect();
    await Therapist.create({
      idTherapist,
      firstName,
      lastName,
      email,
      phone,
      specialization,
      address,
      city,
      country,
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
