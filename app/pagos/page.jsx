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

  if (isLoading) {
    return <p>Cargando...</p>;
  }

  if (!isAuthenticated) {
    return null;
  }

  // 🔹 Manejar la selección de un paciente
  const handleSelectPatient = async (id) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/patient/${id}`);
      setSelectedPatient(response.data.patient);
      setTotalDebt(response.data.patient.estadoDeCuenta?.total || 0);

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

  // 🔹 Manejar el registro de un pago
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

        // 🔹 Recargar la lista de citas y pagos después del pago
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

// Obtener pagos y citas
const pagos = selectedPatient?.estadoDeCuenta?.pagos || [];
const citas = selectedPatient?.estadoDeCuenta?.citas || [];

// 📌 Unir citas y pagos en un solo array
const eventosFinancieros = [
  ...citas.map((cita) => ({ tipo: "cita", cantidad: cita.costo, fecha: new Date(cita.fecha) })),
  ...pagos.map((pago) => ({ tipo: "pago", cantidad: -pago.cantidad, fecha: new Date(pago.fecha) })),
];

// 📌 Ordenar por fecha antes de graficar
eventosFinancieros.sort((a, b) => a.fecha - b.fecha);


// 📌 Inicializar el saldo con la primera cita (si existe)
let saldoActual = citas.length > 0 ? citas[0].costo : 0;
const labels = [];
const data = [];

// 📌 Agregar el primer punto con el saldo inicial
if (citas.length > 0) {
  labels.push(new Date(citas[0].fecha).toLocaleDateString());
  data.push(saldoActual);
}

// 📌 Recalcular el saldo correctamente
eventosFinancieros.forEach((evento, index) => {
  if (index === 0 && evento.tipo === "cita") {
    return; // Evita sumar dos veces la primera cita
  }

  saldoActual += evento.cantidad;
  saldoActual = Math.max(saldoActual, 0); // 🔹 Asegurar que nunca sea negativo
  labels.push(evento.fecha.toLocaleDateString());
  data.push(saldoActual);
});


// 📌 Configuración de la gráfica
const chartData = {
  labels,
  datasets: [
    {
      label: "Deuda Total",
      data,
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
          text: "Saldo en USD",
        },
      },
    },
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Historial de Deuda Total",
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
          <p className="mt-2">Total: ${totalDebt.toFixed(2)}</p>
          <h3 className="text-lg mt-4">Registrar Pago</h3>
          <input
            type="number"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            placeholder="Cantidad"
            className="border p-2 rounded w-full mt-2"
          />
          <button onClick={handleAddPayment} className="bg-green-500 text-white px-4 py-2 mt-2 rounded">
            Registrar Pago
          </button>

          <h3 className="mt-4 text-lg">Gráfica de Deuda Total</h3>
          <div style={{ height: "400px" }}>
            <Line data={chartData} options={options} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Pagos;
