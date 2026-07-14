import dbConnect from "@/lib/dbConnect";
import Appointment from "@/models/Date";
import Service from "@/models/Service";
import { NextResponse } from "next/server";

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

export async function PATCH(request, { params }) {
  await dbConnect();
  const body = await request.json();
  const updates = {};

  if (body.date) updates.date = new Date(`${body.date}T00:00:00.000Z`);
  if (body.start) updates.start = new Date(body.start);
  if (body.end) updates.end = new Date(body.end);
  if (typeof body.duration !== "undefined") updates.duration = Number(body.duration);
  if (body.patientId) updates.patientId = body.patientId;
  if (body.therapistId) updates.therapistId = body.therapistId;
  if (body.serviceId) {
    updates.serviceId = body.serviceId;
    const service = await Service.findById(body.serviceId).lean();
    if (service) {
      updates.title = service.name;
      updates.description = service.name;
      updates.cost = service.cost;
    }
  }
  if (typeof body.cost !== "undefined") updates.cost = Number(body.cost);

  const appointment = await Appointment.findByIdAndUpdate(params.id, updates, { new: true })
    .populate("patientId", "email role profile")
    .populate("therapistId", "email role profile")
    .populate("serviceId", "name duration cost color");

  if (!appointment) return NextResponse.json({ message: "Cita no encontrada" }, { status: 404 });
  return NextResponse.json({ appointment: serialize(appointment) });
}

export async function GET(_request, { params }) {
  await dbConnect();
  const appointment = await Appointment.findById(params.id)
    .populate("patientId", "email role profile")
    .populate("therapistId", "email role profile")
    .populate("serviceId", "name duration cost color");
  if (!appointment) return NextResponse.json({ message: "Cita no encontrada" }, { status: 404 });
  return NextResponse.json({ appointment: serialize(appointment) });
}

export async function DELETE(_request, { params }) {
  await dbConnect();
  const deleted = await Appointment.findByIdAndDelete(params.id);
  if (!deleted) return NextResponse.json({ message: "Cita no encontrada" }, { status: 404 });
  return NextResponse.json({ message: "Cita eliminada" });
}
