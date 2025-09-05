import dbConnect from "@/lib/dbConnect";
import Therapist from "@/models/Therapist";
import { NextResponse } from "next/server";

export async function PUT(request, { params }) {
  const { id } = params;

  const {
    newFirstName: firstName,
    newLastName: lastName,
    newEmail: email,
    newPhone: phone,
    newSpecialization: specialization,
    newAddress: address,
    newCity: city,
    newCountry: country,
  } = await request.json();

  await dbConnect();

  const updatedTherapist = await Therapist.findByIdAndUpdate(
    id,
    {
      firstName,
      lastName,
      email,
      phone,
      specialization,
      address,
      city,
      country,
    },
    { new: true }
  );

  if (!updatedTherapist) {
    return NextResponse.json({ message: "Terapista no encontrado" }, { status: 404 });
  }

  return NextResponse.json({ message: "Terapista actualizado", therapist: updatedTherapist });
}


export async function GET(request, { params }) {
  const { id } = params;
  await dbConnect();
  const therapist = await Therapist.findOne({ _id: id });
  return NextResponse.json({ therapist }, { status: 200 });
}
