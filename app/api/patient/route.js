import dbConnect from "@/lib/dbConnect";
import Patient from "@/models/Patient";
import mongoose from "mongoose";
import { NextResponse } from "next/server";

export async function POST(req) {
  const {
    firstName,
    lastName,
    birthdate,
    gender,
    patientStatus,
    birthCity,
    nationality,
    birthState,
    idType,
  } = await req.json();

  try{
    await dbConnect();
    await Patient.create({firstName, lastName, birthdate, gender, patientStatus, birthCity, nationality, birthState, idType})

    return NextResponse.json({
      msg : ["Mensaje enviado con exito"], success: true
    })
  }
  catch (error){
    if(error instanceof mongoose.Error.ValidationError){
      let errorList = [];
      for(let e in error.errors){
        errorList.push(e.message)
      }

      return NextResponse.json({ msg: errorList})
    }else {
      return NextResponse.json({msg: "No se envio"})
    }
  }
  
}
