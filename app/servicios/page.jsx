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
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950">
      <div className="p-6 max-w-5xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-center">
            Servicios
          </h1>
          <p className="text-center text-zinc-500 mt-1">
            Crea, edita y organiza servicios.
          </p>
        </header>

        {/* FORM CARD */}
        <form
          onSubmit={handleSubmit}
          className="mb-10 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white/70 dark:bg-zinc-900/60 backdrop-blur p-6 shadow-sm"
        >
          <div className="flex items-center justify-between gap-4 mb-5">
            <h2 className="text-xl font-medium">
              {editingService ? "Editar servicio" : "Agregar servicio"}
            </h2>
            {editingService && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-amber-100 text-amber-800 dark:bg-amber-400/10 dark:text-amber-300">
                Modo edición
              </span>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-sm text-zinc-600 dark:text-zinc-300">
                Nombre
              </label>
              <input
                type="text"
                value={name}
                placeholder="Ej. Evaluación inicial"
                onChange={(e) => setName(e.target.value)}
                className="block w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/30"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm text-zinc-600 dark:text-zinc-300">
                Duración (minutos)
              </label>
              <input
                type="number"
                value={duration}
                placeholder="Ej. 60"
                onChange={(e) => setDuration(e.target.value)}
                className="block w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/30"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm text-zinc-600 dark:text-zinc-300">
                Costo
              </label>
              <input
                type="number"
                value={cost}
                placeholder="Ej. 600"
                onChange={(e) => setCost(e.target.value)}
                className="block w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/30"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm text-zinc-600 dark:text-zinc-300">
                Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-12 h-10 rounded-lg border border-zinc-200 dark:border-zinc-800"
                />
                <span className="text-xs font-mono text-zinc-500">{color}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="submit"
              className={`px-5 py-2.5 rounded-xl text-white font-medium shadow-sm transition
                ${
                  editingService
                    ? "bg-amber-500 hover:bg-amber-600"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
            >
              {editingService ? "Actualizar" : "Agregar"}
            </button>

            {editingService && (
              <button
                type="button"
                onClick={() => {
                  setEditingService(null);
                  setName("");
                  setDuration("");
                  setCost("");
                  setColor("");
                }}
                className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-white dark:hover:bg-zinc-900 transition"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>

        {/* LISTA */}
        <section className="rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white/70 dark:bg-zinc-900/60 backdrop-blur p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="text-xl font-medium">Servicios registrados</h2>
            <div className="text-sm text-zinc-500">
              Total: <b>{services.length}</b>
            </div>
          </div>

          {services.length === 0 ? (
            <p className="text-sm text-zinc-500">
              Aún no hay servicios. Agrega el primero arriba.
            </p>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {services.map((service) => (
                <div
                  key={service._id}
                  className="group rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 shadow-sm hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold tracking-tight">
                        {service.name}
                      </h3>
                      <div className="mt-1 space-y-0.5 text-sm text-zinc-600 dark:text-zinc-400">
                        <p>
                          Duración:{" "}
                          <span className="font-medium">
                            {service.duration}
                          </span>{" "}
                          min
                        </p>
                        <p>
                          Costo:{" "}
                          <span className="font-medium">${service.cost}</span>
                        </p>
                        <div className="flex items-center gap-2">
                          <span>Color:</span>
                          <span
                            className="inline-block w-10 h-5 rounded border border-zinc-200 dark:border-zinc-700"
                            style={{ backgroundColor: service.color }}
                            title={service.color}
                          />
                          <code className="text-xs text-zinc-500">
                            {service.color}
                          </code>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleEdit(service)}
                        className="px-3 py-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 shadow-sm"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(service._id)}
                        className="px-3 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 shadow-sm"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
)
}

export default Servicios