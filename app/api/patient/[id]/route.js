import dbConnect from "@/lib/dbConnect";
import Patient from "@/models/Patient";
import { NextResponse } from "next/server";

export async function PUT(request, { params }) {
  const { id } = params;
  const {
    newFirstName: firstName,
    newLastName: lastName,
    newBirthdate: birthdate,
    newGender: gender,
    newPatientStatus: patientStatus,
    newBirthCity: birthCity,
    newNationality: nationality,
    newBirthState: birthState,
    newIdType: idType,
    newContacts: contacts
  } = await request.json();
  await dbConnect();
  await Patient.findByIdAndUpdate(id, {
    firstName,
    lastName,
    birthdate,
    gender,
    patientStatus,
    birthCity,
    nationality,
    birthState,
    idType,
    contacts
  });
  return NextResponse.json({ message: "Paciente Actualizado" });
}

export async function GET(request, { params }) {
  const { id } = params;
  await dbConnect();
  const patient = await Patient.findOne({ _id: id });
  if (!patient) {
    return NextResponse.json({ msg: "Paciente no encontrado" }, { status: 404 });
  }
  return NextResponse.json({ patient }, { status: 200 });
}
