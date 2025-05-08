import dbConnect from "@/lib/dbConnect";
import Service from "@/models/Service";
import { NextResponse } from "next/server";

export async function PUT(request, { params }){
    const { id } = params
    const { name, duration, cost, color} = await request.json()
    await dbConnect()

    const updatedService = await Service.findByIdAndUpdate(id, {name, duration, cost, color}, { new: true })
    if (!updatedService) {
        return NextResponse.json({ message: "Servicio no encontrado" }, { status: 404 })
    }
    return NextResponse.json(updatedService)
}

export async function DELETE(request, {params}){
    const { id } = params
    await dbConnect()
    const deletedService = await Service.findByIdAndDelete(id)
    if(!deletedService) {
        return NextResponse.json({ message: "Servicio no encontrado"}, { status: 404 })
    }
    return NextResponse.json({ message: "Servicio eliminado correctamente"})
}