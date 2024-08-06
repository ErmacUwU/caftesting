"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";

const Pagos = () => {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await axios.get('/api/patient');
        setPatients(response.data.patients || []);
      } catch (error) {
        console.error("Error fetching patients:", error);
      }
    };

    fetchPatients();
  }, []);

  const handleSelectPatient = async (id) => {
    try {
      const response = await axios.get(`/api/patient/${id}`);
      setSelectedPatient(response.data.patient);
    } catch (error) {
      console.error("Error fetching patient:", error);
    }
  };

  const handleAddPayment = async () => {
    if (!selectedPatient || paymentAmount <= 0) return;

    try {
      await axios.patch('/api/patient', {
        pacienteId: selectedPatient._id,
        cantidad: paymentAmount
      });

      const updatedPatient = { ...selectedPatient };
      updatedPatient.estadoDeCuenta.total -= paymentAmount;
      updatedPatient.estadoDeCuenta.pagos.push({
        fecha: new Date(),
        cantidad: paymentAmount
      });

      setSelectedPatient(updatedPatient);
      setPaymentAmount("");
    } catch (error) {
      console.error("Error adding payment:", error);
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
          <h2 className="text-xl">Estado de cuenta de {selectedPatient.firstName} {selectedPatient.lastName}</h2>
          <p>Total: ${selectedPatient.estadoDeCuenta.total}</p>
          <h3 className="mt-2">Registrar Pago</h3>
          <input
            type="number"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            placeholder="Cantidad"
          />
          <button onClick={handleAddPayment}>Registrar Pago</button>
        </div>
      )}
    </div>
  );
};

export default Pagos;
