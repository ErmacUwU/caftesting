"use client"

import { useState, useEffect } from "react"
import axios from "axios"

const Servicios = () => {
    const [services, setServices] = useState([])
    const [name, setName] = useState("")
    const [duration, setDuration] = useState("")
    const [cost, setCost] = useState("")
    const [editingService, setEditingService] = useState(null)
    const [color, setColor] = useState("")

    const fetchServices = async () => {
        const res = await axios.get("/api/service")
        setServices(res.data.services)
    }

    useEffect(() => {
        fetchServices()
    }, [])

    const handleSubmit = async (e) => {
        e.preventDefault()
        if(editingService){
            //Editar
            await axios.put(`/api/service/${editingService._id}`, { name, duration, cost, color })
            setEditingService(null)
        } else {
            //Crear
            await axios.post("/api/service", { name, duration, cost, color })
        }
        setName("")
        setDuration("")
        setCost("")
        setColor("")
        fetchServices()
    }

    const handleEdit = (service) => {
        setEditingService(service)
        setName(service.name)
        setDuration(service.duration)
        setCost(service.cost)
        setColor(service.color)
    }

    const handleDelete = async (id) => {
        await axios.delete(`/api/service/${id}`)
        fetchServices()
    }

return (
    <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-3xl text-center mb-6">CRUD Servicios</h1>

        <form onSubmit={handleSubmit} className="mb-8 bg-gray-100 p-4">
            <h2 className="text-xl mb-4">{editingService ? "Editar Servicio" : "Agregar Servicio"}</h2>

            <input
                type="text"
                value={name}
                placeholder="Nombre"
                onChange={(e) => setName(e.target.value)}
                className="block w-full p-2 mb-2 border rounded"
                required
            />
            <input
                type="number"
                value={duration}
                placeholder="Duracion (minutos)"
                onChange={(e) => setDuration(e.target.value)}
                className="block w-full p-2 mb-2 border rounded"
                required
            />
            <input
                type="number"
                value={cost}
                placeholder="Costo"
                onChange={(e) => setCost(e.target.value)}
                className="block w-full p-2 mb-2 border rounded"
                required
            />
            <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="block w-16 h-10 mb-2"
            />
            <button type="submit" className="bg-blue-500 text-white py-2 px-4">{editingService ? "Actualizar" : "Agregar"}</button>
        </form>

        <div className="bg-white p-4 rounded shadow">
            <h2 className="text-xl mb-4">Servicio Registrado</h2>
            {services.map((service) => (
                <div key={service._id} className="flex justify-between items-center border-b py-2">
                    <div>
                        <h3 className="f">{service.name}</h3>
                        <p>Duración: {service.duration} min</p>
                        <p>Costo: ${service.cost}</p>
                        <p className="flex gap-2">Color:<div className="w-11 h-6" style={ {backgroundColor: service.color}}></div></p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => handleEdit(service)} className="bg-yellow-400 text-white px-2 py-1">Editar</button>
                        <button onClick={() => handleDelete(service._id)} className="bg-red-500 text-white px-2 py-1">Eliminar</button>
                    </div>


                </div>
            ))}
        </div>

    </div>
)
}

export default Servicios