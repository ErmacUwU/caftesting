import dbConnect from "@/lib/dbConnect";
import Service from "@/models/Service";
import { NextResponse } from "next/server";

export async function PUT(request, { params }){
    try {
        const { id } = params
        const { name, duration, cost, color} = await request.json()
        await dbConnect()

        const updatedService = await Service.findByIdAndUpdate(id, {name, duration, cost, color}, { new: true })
        if (!updatedService) {
            return NextResponse.json({ message: "Servicio no encontrado" }, { status: 404 })
        }
        return NextResponse.json(updatedService)
    } catch (error) {
        console.error("Error actualizando servicio:", error)
        return NextResponse.json({ message: "Error al actualizar servicio" }, { status: 500 })
    }
}

export async function DELETE(request, {params}){
    try {
        const { id } = params
        await dbConnect()
        const deletedService = await Service.findByIdAndDelete(id)
        if(!deletedService) {
            return NextResponse.json({ message: "Servicio no encontrado"}, { status: 404 })
        }
        return NextResponse.json({ message: "Servicio eliminado correctamente"})
    } catch (error) {
        console.error("Error eliminando servicio:", error)
        return NextResponse.json({ message: "Error al eliminar servicio" }, { status: 500 })
    }
}