import dbConnect from "@/lib/dbConnect";
import UserTrue from "@/models/UserTrue";
import PatientU from "@/models/PatientU"; // Importación correcta
import { NextResponse } from "next/server";

// 📌 GET: Obtener el perfil completo del paciente a través del Usuario
export async function GET(request, { params }) {
  try {
    await dbConnect();
    const { id } = params;

    // Nota: El string dentro de .populate() debe ser el nombre del campo en el esquema de UserTrue
    const user = await UserTrue.findById(id).populate("patientProfile");

    if (!user || user.role !== "patient") {
      return NextResponse.json({ msg: "Paciente no encontrado" }, { status: 404 });
    }

    // Retornamos el perfil contenido en PatientU
    return NextResponse.json({ patient: user.patientProfile }, { status: 200 });
  } catch (error) {
    console.error("Error en GET:", error);
    return NextResponse.json({ msg: "Error al obtener datos" }, { status: 500 });
  }
}

// 📌 PUT: Actualizar datos personales en PatientU
export async function PUT(request, { params }) {
  try {
    await dbConnect();
    const { id } = params; 
    const data = await request.json();

    const user = await UserTrue.findById(id);
    if (!user || !user.patientProfile) {
      return NextResponse.json({ msg: "Perfil no vinculado" }, { status: 404 });
    }

    // Usamos el modelo PatientU para actualizar
    const updatedProfile = await PatientU.findByIdAndUpdate(
      user.patientProfile,
      {
        firstName: data.newFirstName,
        lastName: data.newLastName,
        birthdate: data.newBirthdate,
        gender: data.newGender,
        patientStatus: data.newPatientStatus,
        birthCity: data.newBirthCity,
        nationality: data.newNationality,
        birthState: data.newBirthState,
        idType: data.newIdType,
        contacts: data.newContacts,
      },
      { new: true }
    );

    return NextResponse.json({ message: "Paciente Actualizado", profile: updatedProfile }, { status: 200 });
  } catch (error) {
    console.error("Error en PUT:", error);
    return NextResponse.json({ msg: "Error al actualizar perfil" }, { status: 500 });
  }
}

// 📌 PATCH: Actualizar Estado de Cuenta (Citas o Pagos) en PatientU
export async function PATCH(request, { params }) {
  try {
    await dbConnect();
    const { id } = params; 
    const { nuevaCita, cantidad, metodoPago } = await request.json();

    const user = await UserTrue.findById(id).populate("patientProfile");
    if (!user || !user.patientProfile) {
      return NextResponse.json({ msg: "Perfil no encontrado" }, { status: 404 });
    }

    const profile = user.patientProfile; // Este es un documento de PatientU

    // Escenario A: Agregar Cita
    if (nuevaCita) {
      profile.estadoDeCuenta.citas.push({
        fecha: nuevaCita.fecha || new Date(),
        costo: Number(nuevaCita.costo),
        descripcion: nuevaCita.descripcion || "Consulta"
      });
      profile.estadoDeCuenta.total += Number(nuevaCita.costo);
    }

    // Escenario B: Registrar Pago
    if (cantidad) {
      const monto = Number(cantidad);
      profile.estadoDeCuenta.pagos.push({
        fecha: new Date(),
        cantidad: monto,
        metodoPago: metodoPago || "efectivo"
      });
      profile.estadoDeCuenta.total -= monto;
    }

    // Guardar los cambios en el documento de PatientU
    await profile.save();

    return NextResponse.json({
      msg: "Finanzas actualizadas",
      estadoDeCuenta: profile.estadoDeCuenta,
    }, { status: 200 });

  } catch (error) {
    console.error("Error en PATCH:", error);
    return NextResponse.json({ msg: "Error al actualizar estado de cuenta" }, { status: 500 });
  }
}