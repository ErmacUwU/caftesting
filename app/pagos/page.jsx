"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.js";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Line } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

const Pagos = () => {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("efectivo");
  const [totalDebt, setTotalDebt] = useState(0);
  const [appointments, setAppointments] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    const fetchPatients = async () => {
      setLoading(true);
      try {
        const response = await axios.get("/api/patient");
        setPatients(response.data.patient || []);
      } catch (error) {
        console.error("Error fetching patients:", error);
        setErrorMessage("Error al cargar la lista de pacientes.");
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  const handleSelectPatient = async (id) => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await axios.get(`/api/patient/${id}`);
      setSelectedPatient(response.data.patient);
      setTotalDebt(response.data.patient.estadoDeCuenta?.total || 0);

      const appointmentsRes = await axios.get(`/api/date?patientId=${id}`);
      setAppointments(appointmentsRes.data.dates || []);
      setErrorMessage("");
    } catch (error) {
      console.error("Error fetching patient:", error);
      setErrorMessage("Error al cargar los datos del paciente.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayment = async () => {
    if (!selectedPatient || paymentAmount <= 0) {
      setErrorMessage("Debe seleccionar un paciente y la cantidad debe ser mayor a cero.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.patch(`/api/patient/${selectedPatient._id}/pago`, {
        cantidad: parseFloat(paymentAmount),
        metodoPago: selectedPaymentMethod,
      });

      if (response.status === 200) {
        setSelectedPatient({ ...selectedPatient, estadoDeCuenta: response.data.estadoDeCuenta });
        setTotalDebt(response.data.estadoDeCuenta.total);
        setErrorMessage("");
        setPaymentAmount("");
        handleSelectPatient(selectedPatient._id);
      } else {
        setErrorMessage(response.data.msg || "Error desconocido al registrar el pago");
      }
    } catch (error) {
      console.error("Error adding payment:", error);
      setErrorMessage("Error al registrar el pago. Por favor, intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const pagos = selectedPatient?.estadoDeCuenta?.pagos || [];
  const citas = selectedPatient?.estadoDeCuenta?.citas || [];

  const eventosFinancieros = [
    ...citas.map((cita) => ({ tipo: "cita", cantidad: cita.costo, fecha: new Date(cita.fecha) })),
    ...pagos.map((pago) => ({ tipo: "pago", cantidad: -pago.cantidad, fecha: new Date(pago.fecha), raw: pago })),
  ].sort((a, b) => a.fecha - b.fecha);

  let saldoActual = 0;
  const labels = [];
  const deudaData = []
  const pagosData = []

  // if (citas.length > 0) {
  //   labels.push(new Date(citas[0].fecha).toLocaleDateString());
  //   data.push(saldoActual);
  // }

  eventosFinancieros.forEach((evento) => {
    const fechaStr = evento.fecha.toLocaleDateString("es-MX")

    saldoActual += evento.cantidad
    saldoActual = Math.max(saldoActual, 0)

    labels.push(fechaStr)
    deudaData.push(saldoActual)

    if(evento.tipo === "pago") {
      pagosData.push({
        x: fechaStr,
        y: saldoActual,
        label: `Pago: $${-evento.cantidad}`,
      })
    }
  });

  const chartData = {
    labels,
    datasets: [
      {
        label: "Deuda Total",
        data: deudaData,
        borderColor: "rgba(255, 99, 132, 1)",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        fill: true,
        tension: 0.3,
      },
      {
        label: "Pagos Realizados",
        data: pagosData,
        bordergroundColor: "rgba(54, 162, 235, 0.8)",
        bordergroundColor: "rgba(54,162, 235, 0.8)",
        pointStyle: 'triangule',
        showLine: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: "Saldo en USD" },
      },
    },
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Historial de Deuda Total" },
    },
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-6">💰 Pagos y Estado de Cuenta</h1>

      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 p-3 rounded mb-4">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">👥 Lista de Pacientes</h2>
          {loading ? (
            <p>Cargando pacientes...</p>
          ) : patients.length ? (
            <select
              onChange={(e) => handleSelectPatient(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded px-4 py-2"
              defaultValue=""
            >
              <option value="" disabled>
                Selecciona un paciente
              </option>
              {patients.map((patient) => (
                <option key={patient._id} value={patient._id}>
                  {patient.firstName} {patient.lastName}
                </option>
              ))}
            </select>
          ) : (
            <p>No hay pacientes disponibles.</p>
          )}
        </div>

        {selectedPatient && (
          <div className="bg-white shadow-lg rounded-lg p-6">
            <h2 className="text-xl font-bold mb-2">
              Estado de cuenta de {selectedPatient.firstName} {selectedPatient.lastName}
            </h2>
            <p className="text-gray-700 mb-4">
              💳 Total actual: <strong>${totalDebt.toFixed(2)}</strong>
            </p>

            <div className="mb-4">
              <label className="block mb-1 font-semibold">Registrar un pago</label>
              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Cantidad"
                className="border w-full p-2 rounded"
              />
              <button
                onClick={handleAddPayment}
                className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 mt-2 rounded"
              >
                Registrar Pago
              </button>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">📊 Gráfica de Deuda Total</h3>
              <div className="h-64">
                <Line data={chartData} options={options} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Pagos;
