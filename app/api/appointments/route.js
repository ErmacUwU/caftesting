export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import dbConnect from "@/lib/dbConnect";
import Appointment from "@/models/Date";
import User from "@/models/User";
import Service from "@/models/Service";
import { NextResponse } from "next/server";

function normalizeISODate(dateOnly) {
  return new Date(`${dateOnly}T00:00:00.000Z`);
}

function serialize(appointment) {
  const service = appointment.serviceId;
  return {
    _id: appointment._id,
    idDate: appointment.idDate,
    date: appointment.date,
    start: appointment.start,
    end: appointment.end,
    duration: appointment.duration,
    patient: appointment.patientId || appointment.patient,
    therapist: appointment.therapistId || appointment.therapist,
    patientId: appointment.patientId?._id || appointment.patientId || appointment.patient,
    therapistId: appointment.therapistId?._id || appointment.therapistId || appointment.therapist,
    serviceId: service?._id || appointment.serviceId,
    service: service && typeof service === "object" ? service : null,
    title: appointment.title || service?.name || "",
    description: appointment.description || service?.name || "",
    cost: appointment.cost ?? service?.cost ?? 0,
  };
}

export async function GET(request) {
  await dbConnect();
  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get("patientId");
  const query = patientId ? { $or: [{ patientId }, { patient: patientId }] } : {};
  const appointments = await Appointment.find(query)
    .populate("patientId", "email role profile")
    .populate("therapistId", "email role profile")
    .populate("serviceId", "name duration cost color")
    .sort({ start: 1 });
  return NextResponse.json({ appointments: appointments.map(serialize) });
}

export async function POST(request) {
  await dbConnect();
  const body = await request.json();
  const {
    idDate,
    date,
    start,
    end,
    duration,
    patientId,
    therapistId,
    serviceId,
    cost,
    title,
    description,
  } = body;

  if (!patientId || !therapistId || !serviceId || !start || !end) {
    return NextResponse.json({ message: "Faltan campos obligatorios" }, { status: 400 });
  }

  const [patient, therapist, service] = await Promise.all([
    User.findOne({ _id: patientId, role: "patient" }),
    User.findOne({ _id: therapistId, role: "therapist" }),
    Service.findById(serviceId),
  ]);

  if (!patient || !therapist || !service) {
    return NextResponse.json({ message: "Relaciones inválidas en cita" }, { status: 400 });
  }

  const appointment = await Appointment.create({
    idDate,
    date: date ? normalizeISODate(date) : new Date(start),
    start: new Date(start),
    end: new Date(end),
    duration: Number(duration),
    patientId,
    therapistId,
    serviceId,
    title: title || service.name,
    description: description || service.name,
    cost: Number.isFinite(Number(cost)) ? Number(cost) : service.cost,
  });

  const populated = await Appointment.findById(appointment._id)
    .populate("patientId", "email role profile")
    .populate("therapistId", "email role profile")
    .populate("serviceId", "name duration cost color");

  return NextResponse.json({ appointment: serialize(populated) }, { status: 201 });
}
