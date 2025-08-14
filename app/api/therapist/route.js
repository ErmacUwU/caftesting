import dbConnect from "@/lib/dbConnect";
import Therapist from "@/models/Therapist";
import mongoose from "mongoose";
import User from "@/models/User";
import bcrypt from "bcryptjs";
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
    password,
  } = await req.json();

  try {
    await dbConnect();

    const userExists = await User.findOne({ email })
    if (userExists){
      return NextResponse.json(
        { msg: "Este correo ya está registrado", success: false },
        { status: 400 })
    }

    const newTherapist = await Therapist.create({
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

    const hashedPassword = await bcrypt.hash(password, 10)
    await User.create({
      email,
      passwordHash: hashedPassword,
      role: "therapist",
      refId: newTherapist._id,
      refType: "Therapist",
    })

    return NextResponse.json({
      msg: ["Terapeuta y usuario creados con éxito"],
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
      return NextResponse.json({ msg: error.message || "Error desconocido" });
    }
  }
}

export async function GET(){

    await dbConnect();
    const therapist = await Therapist.find()
    return NextResponse.json({ therapist })
}

export async function DELETE(req){
  const id = req.nextUrl.searchParams.get("id");
  await dbConnect();
  await Therapist.findByIdAndDelete(id)
  return NextResponse.json({ msg: "Terapeuta Eliminado"})
}
