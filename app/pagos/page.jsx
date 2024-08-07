"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";

const Pagos = () => {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [totalPayments, setTotalPayments] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  // Fetch pacientes cuando el componente se monte
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await axios.get("/api/patient");
        setPatients(response.data.patients || []);
      } catch (error) {
        console.error("Error fetching patients:", error);
        setErrorMessage("Error al cargar la lista de pacientes.");
      }
    };

    fetchPatients();
  }, []);

  // Manejar la selección de un paciente
  const handleSelectPatient = async (id) => {
    try {
      const response = await axios.get(`/api/patient/${id}`);
      setSelectedPatient(response.data.patient);
      setTotalPayments(response.data.patient.estadoDeCuenta?.total || 0);
      setErrorMessage(""); // Limpiar mensaje de error
    } catch (error) {
      console.error("Error fetching patient:", error);
      setErrorMessage("Error al cargar los datos del paciente.");
    }
  };

  // Manejar el registro de un pago
  const handleAddPayment = async () => {
    if (!selectedPatient || paymentAmount <= 0) {
      setErrorMessage(
        "Debe seleccionar un paciente y la cantidad debe ser mayor a cero."
      );
      return;
    }

    try {
      const response = await axios.patch("/api/patient", {
        pacienteId: selectedPatient._id,
        cantidad: parseFloat(paymentAmount),
      });

      console.log("Respuesta de la API:", response.data);

      if (response.data.success) {
        if (
          response.data.estadoDeCuenta &&
          typeof response.data.estadoDeCuenta.total === "number"
        ) {
          const updatedPatient = { ...selectedPatient };
          updatedPatient.estadoDeCuenta = response.data.estadoDeCuenta;

          setSelectedPatient(updatedPatient);
          setTotalPayments(response.data.estadoDeCuenta.total);
          setErrorMessage(""); // Limpiar mensaje de error
        } else {
          console.error("Estado de cuenta no actualizado o no existe");
          setErrorMessage("Estado de cuenta no actualizado o no existe");
        }
      } else {
        console.error(response.data.msg);
        setErrorMessage(
          response.data.msg || "Error desconocido al registrar el pago"
        );
      }

      setPaymentAmount("");
    } catch (error) {
      console.error("Error adding payment:", error);
      setErrorMessage(
        "Error al registrar el pago. Por favor, intenta de nuevo."
      );
    }
  };

  return (
    <div>
      <h1>Pagos y Estado de Cuenta</h1>
      <div>
        <h2>Lista de Pacientes</h2>
        {patients.map((patient) => (
          <div key={patient._id}>
            <button onClick={() => handleSelectPatient(patient._id)}>
              Ver Estado de Cuenta de {patient.firstName} {patient.lastName}
            </button>
          </div>
        ))}
      </div>
      {selectedPatient && (
        <div className="mt-4">
          <h2 className="text-xl">
            Estado de cuenta de {selectedPatient.firstName}{" "}
            {selectedPatient.lastName}
          </h2>
          <p>Total: ${totalPayments}</p>
          <h3 className="mt-2">Registrar Pago</h3>
          {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
          <input
            type="number"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            placeholder="Cantidad"
            className="text-black"
          />
          <button onClick={handleAddPayment}>Registrar Pago</button>
        </div>
      )}
    </div>
  );
};

export default Pagos;
