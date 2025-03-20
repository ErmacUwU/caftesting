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
  const [totalPayments, setTotalPayments] = useState(0);
  const [appointments, setAppointments] = useState([]); // 🔹 Citas del paciente
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login'); // ⬅ Redirige solo si no está autenticado
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

  if (isLoading) {
    return <p>Cargando...</p>;
  }

  if (!isAuthenticated) {
    return null;
  }

  // Manejar la selección de un paciente
  const handleSelectPatient = async (id) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/patient/${id}`);
      setSelectedPatient(response.data.patient);
      setTotalPayments(response.data.patient.estadoDeCuenta?.total || 0);
      
      // 🔹 Obtener citas del paciente
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

  // Manejar el registro de un pago
  const handleAddPayment = async () => {
    if (!selectedPatient || paymentAmount <= 0) {
      setErrorMessage("Debe seleccionar un paciente y la cantidad debe ser mayor a cero.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.patch("/api/patient", {
        pacienteId: selectedPatient._id,
        cantidad: parseFloat(paymentAmount),
      });

      if (response.data.success) {
        const updatedPatient = { ...selectedPatient, estadoDeCuenta: response.data.estadoDeCuenta };
        setSelectedPatient(updatedPatient);
        setTotalPayments(response.data.estadoDeCuenta.total);
        setErrorMessage("");

        // 🔹 Recargar la lista de citas y pagos después del pago
        handleSelectPatient(selectedPatient._id);
      } else {
        setErrorMessage(response.data.msg || "Error desconocido al registrar el pago");
      }

      setPaymentAmount("");
    } catch (error) {
      console.error("Error adding payment:", error);
      setErrorMessage("Error al registrar el pago. Por favor, intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  // Configurar los datos para la gráfica de deuda
  const totalDebt = selectedPatient?.estadoDeCuenta?.total || 0;
  
  const chartData = {
    labels: selectedPatient?.estadoDeCuenta?.pagos?.map(pago => new Date(pago.fecha).toLocaleDateString()) || [],
    datasets: [
      {
        label: "Deuda Total",
        data: selectedPatient?.estadoDeCuenta?.pagos?.reduce((acc, pago) => {
          const lastDebt = acc[acc.length - 1] || totalDebt;
          acc.push(Math.max(0, lastDebt - pago.cantidad));
          return acc;
        }, [totalDebt]) || [totalDebt],
        borderColor: "rgba(255, 99, 132, 1)",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Monto en USD',
        },
      },
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Deuda Total',
      },
    },
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Pagos y Estado de Cuenta</h1>
      {loading ? (
        <p>Cargando...</p>
      ) : (
        <div>
          <h2 className="text-xl mt-4">Lista de Pacientes</h2>
          {patients.length ? (
            patients.map((patient) => (
              <div key={patient._id} className="mt-2">
                <button
                  onClick={() => handleSelectPatient(patient._id)}
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                  Ver Estado de Cuenta de {patient.firstName} {patient.lastName}
                </button>
              </div>
            ))
          ) : (
            <p>No hay pacientes disponibles.</p>
          )}
        </div>
      )}

      {selectedPatient && (
        <div className="mt-4 border p-4 rounded shadow">
          <h2 className="text-xl font-semibold">
            Estado de cuenta de {selectedPatient.firstName} {selectedPatient.lastName}
          </h2>
          <p className="mt-2">Total: ${totalPayments.toFixed(2)}</p>
          <h3 className="text-lg mt-4">Registrar Pago</h3>
          {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
          <input
            type="number"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            placeholder="Cantidad"
            className="border p-2 rounded w-full mt-2"
          />
          <button
            onClick={handleAddPayment}
            className="bg-green-500 text-white px-4 py-2 mt-2 rounded"
          >
            Registrar Pago
          </button>

          <h3 className="mt-4 text-lg">Gráfica de Deuda Total</h3>
          <div style={{ height: "400px" }}>
            <Line data={chartData} options={options} />
          </div>

          {/* 🔹 Movimientos Recientes */}
          <h3 className="mt-6 text-lg">Movimientos Recientes</h3>
          <h4 className="text-md mt-2">Citas Registradas</h4>
          <ul>
            {appointments.map((app) => (
              <li key={app._id} className="border-b py-2">
                {app.title} - ${app.cost}
              </li>
            ))}
          </ul>

          <h4 className="text-md mt-4">Pagos Realizados</h4>
          <ul>
            {selectedPatient?.estadoDeCuenta?.pagos?.map((pago, index) => (
              <li key={index} className="border-b py-2">
                {new Date(pago.fecha).toLocaleDateString()} - ${pago.cantidad}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Pagos;
