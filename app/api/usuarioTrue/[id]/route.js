import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import PatientU from "@/models/PatientU";
import TherapistU from "@/models/TherapistU";

export async function PUT(req, { params }) {
  try {
    await dbConnect();
    const { id } = params; // Este es el profileId
    const { role, profileData } = await req.json();

    let updatedProfile;

    if (role === "patient") {
      updatedProfile = await PatientU.findByIdAndUpdate(
        id,
        { $set: profileData },
        { new: true }
      );
    } else if (role === "therapist") {
      updatedProfile = await TherapistU.findByIdAndUpdate(
        id,
        { $set: profileData },
        { new: true }
      );
    }

    if (!updatedProfile) {
      return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ message: "Actualizado", updatedProfile });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
// El DELETE se ve bien, solo asegúrate de añadir TherapistU también:
export async function DELETE(req, { params }) {
  try {
    await dbConnect();
    const { id } = params; 

    const user = await UserTrue.findById(id);
    if (!user) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    if (user.patientProfile) await PatientU.findByIdAndDelete(user.patientProfile);
    if (user.therapistProfile) await TherapistU.findByIdAndDelete(user.therapistProfile);

    await UserTrue.findByIdAndDelete(id);
    return NextResponse.json({ message: "Borrado exitoso" });
  } catch (error) {
    return NextResponse.json({ error: "Error de servidor" }, { status: 500 });
  }
}



