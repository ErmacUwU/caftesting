"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext.js";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Line } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

// Registro global de Chart.js
Chart.register(...registerables);

const Pagos = () => {
  // -------------------------------------------------------------------------
  // 1. ESTADOS Y HOOKS
  // -------------------------------------------------------------------------
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("efectivo");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // -------------------------------------------------------------------------
  // 2. EFECTOS (Autenticación y Carga Inicial)
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const response = await axios.get("/api/usuarioTrue?role=patient");
        // Ajustamos según la estructura que devuelva tu API
        const data = response.data.users || response.data.patient || response.data;
        setUsers(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error al cargar pacientes:", error);
        setErrorMessage("Error de conexión al cargar la lista de pacientes.");
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) fetchUsers();
  }, [isAuthenticated]);

  // -------------------------------------------------------------------------
  // 3. PROCESAMIENTO DE DATOS (Memoizado para rendimiento)
  // -------------------------------------------------------------------------
  const { profile, citas, pagos, totalDebt, historial, chartData } = useMemo(() => {
    const p = selectedUser?.patientProfile || null;
    const c = p?.estadoDeCuenta?.citas || [];
    const pa = p?.estadoDeCuenta?.pagos || [];
    const total = p?.estadoDeCuenta?.total || 0;

    const normKey = (d) => new Date(d).toISOString().split("T")[0];
    const fmtEs = (dateStr) => {
      const [y, m, d] = dateStr.split("-");
      return new Date(y, m - 1, d).toLocaleDateString("es-MX");
    };

    // Crear historial unificado
    const rawHistorial = [
      ...c.map((item) => ({
        fecha: item.fecha,
        tipo: "Cita Médica",
        monto: Number(item.costo),
        metodo: "N/A",
        rawDate: new Date(item.fecha),
      })),
      ...pa.map((item) => ({
        fecha: item.fecha,
        tipo: "Pago Recibido",
        monto: -Number(item.cantidad),
        metodo: item.metodoPago,
        rawDate: new Date(item.fecha),
      })),
    ].sort((a, b) => a.rawDate - b.rawDate);

    // Lógica para la gráfica (Saldo acumulado por día)
    const porDia = new Map();
    rawHistorial.forEach((ev) => {
      const key = normKey(ev.fecha);
      if (!porDia.has(key)) porDia.set(key, { citas: 0, pagos: 0 });
      const acc = porDia.get(key);
      if (ev.monto > 0) acc.citas += ev.monto;
      else acc.pagos += Math.abs(ev.monto);
    });

    const diasOrdenados = Array.from(porDia.keys()).sort();
    let saldoAcumulado = 0;
    const labels = [];
    const values = [];

    diasOrdenados.forEach((dayKey) => {
      const { citas, pagos } = porDia.get(dayKey);
      saldoAcumulado += citas - pagos;
      labels.push(fmtEs(dayKey));
      values.push(saldoAcumulado);
    });

    const cData = {
      labels,
      datasets: [
        {
          label: "Deuda Total ($)",
          data: values,
          borderColor: "#3b82f6",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: "#fff",
          borderWidth: 3,
        },
      ],
    };

    return {
      profile: p,
      citas: c,
      pagos: pa,
      totalDebt: total,
      historial: rawHistorial,
      chartData: cData,
    };
  }, [selectedUser]);

  // -------------------------------------------------------------------------
  // 4. MANEJADORES DE EVENTOS (Handlers)
  // -------------------------------------------------------------------------
  const handleSelectUser = (id) => {
    if (!id) return;
    const found = users.find((u) => u._id === id);
    setSelectedUser(found);
    setErrorMessage("");
    setSuccessMessage("");
    setPaymentAmount("");
  };

  const handleAddPayment = async () => {
    if (!selectedUser || !paymentAmount || parseFloat(paymentAmount) <= 0) {
      setErrorMessage("Por favor, ingrese un monto válido.");
      return;
    }

    setActionLoading(true);
    setErrorMessage("");
    try {
      // Usamos el ID del Usuario para el PATCH según tu nueva ruta
      const response = await axios.patch(`/api/usuarioTrue/${selectedUser._id}`, {
        cantidad: parseFloat(paymentAmount),
        metodoPago: selectedPaymentMethod,
      });

      if (response.status === 200) {
        // Actualización local para evitar recargar toda la lista
        setSelectedUser((prev) => ({
          ...prev,
          patientProfile: {
            ...prev.patientProfile,
            estadoDeCuenta: response.data.estadoDeCuenta,
          },
        }));
        setSuccessMessage("¡Pago registrado correctamente!");
        setPaymentAmount("");
        setTimeout(() => setSuccessMessage(""), 4000);
      }
    } catch (error) {
      setErrorMessage("Error al procesar el pago en el servidor.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportExcel = async () => {
    if (!profile) return;
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Estado de Cuenta");

    // Estilos Básicos
    sheet.columns = [
      { header: "Fecha", key: "f", width: 15 },
      { header: "Concepto", key: "c", width: 25 },
      { header: "Monto", key: "m", width: 15 },
      { header: "Método", key: "me", width: 15 },
    ];

    sheet.addRow(["Paciente:", `${profile.firstName} ${profile.lastName}`]);
    sheet.addRow(["Saldo Pendiente:", `$${totalDebt.toFixed(2)}`]);
    sheet.addRow([]);

    historial.forEach((h) => {
      sheet.addRow([
        new Date(h.fecha).toLocaleDateString("es-MX"),
        h.tipo,
        h.monto.toFixed(2),
        h.metodo,
      ]);
    });

    const canvas = document.querySelector("canvas");
    if (canvas) {
      const base64 = canvas.toDataURL("image/png");
      const imgId = workbook.addImage({ base64, extension: "png" });
      sheet.addImage(imgId, {
        tl: { col: 0, row: historial.length + 6 },
        ext: { width: 500, height: 300 },
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Estado_${profile.lastName}.xlsx`);
  };

  // -------------------------------------------------------------------------
  // 5. RENDERIZADO (JSX)
  // -------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Encabezado */}
        <header className="mb-10 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">
              Control de Pagos
            </h1>
            <p className="text-slate-500 mt-1 text-lg">
              Seguimiento financiero y estados de cuenta
            </p>
          </div>
          {selectedUser && (
            <button
              onClick={handleExportExcel}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-lg transition-all flex items-center gap-2"
            >
              📂 Exportar Reporte
            </button>
          )}
        </header>

        {/* Notificaciones */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-800 rounded shadow-sm">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-100 border-l-4 border-green-500 text-green-800 rounded shadow-sm">
            {successMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* COLUMNA IZQUIERDA: BUSCADOR Y REGISTRO */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100">
              <label className="block text-xs font-black text-slate-400 uppercase mb-3 tracking-widest">
                Seleccionar Paciente
              </label>
              <select
                onChange={(e) => handleSelectUser(e.target.value)}
                value={selectedUser?._id || ""}
                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-blue-400 outline-none transition-all text-slate-700 font-medium"
              >
                <option value="">Buscar en la lista...</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.patientProfile?.firstName} {u.patientProfile?.lastName}
                  </option>
                ))}
              </select>
            </div>

            {selectedUser && (
              <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <span className="text-blue-500">◆</span> Registrar Pago
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-slate-500 mb-1 block">Monto a abonar ($)</label>
                    <input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="w-full p-4 text-2xl font-bold text-emerald-600 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-emerald-400"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-500 mb-1 block">Método de pago</label>
                    <select
                      value={selectedPaymentMethod}
                      onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                      className="w-full p-3 bg-white border border-slate-200 rounded-lg text-slate-600"
                    >
                      <option value="efectivo">Efectivo</option>
                      <option value="transferencia">Transferencia Bancaria</option>
                      <option value="tarjeta">Tarjeta Crédito/Débito</option>
                    </select>
                  </div>
                  <button
                    onClick={handleAddPayment}
                    disabled={actionLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-black py-4 rounded-xl shadow-blue-200 shadow-lg transition-all transform active:scale-95"
                  >
                    {actionLoading ? "Procesando..." : "CONFIRMAR TRANSACCIÓN"}
                  </button>
                </div>
              </div>
            )}
          </aside>

          {/* COLUMNA DERECHA: DASHBOARD */}
          <main className="lg:col-span-8 space-y-8">
            {!selectedUser ? (
              <div className="h-96 bg-slate-100 rounded-3xl border-4 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                <div className="text-6xl mb-4">💳</div>
                <p className="text-xl font-medium text-center px-6">
                  Seleccione un paciente de la lista para visualizar <br /> su estado de cuenta y trayectoria.
                </p>
              </div>
            ) : (
              <>
                {/* Card de Resumen Rápido */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-3xl shadow-2xl text-white flex flex-col md:flex-row justify-between items-center">
                  <div className="text-center md:text-left mb-6 md:mb-0">
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-2">Paciente Seleccionado</p>
                    <h2 className="text-4xl font-black">
                      {profile.firstName} {profile.lastName}
                    </h2>
                  </div>
                  <div className="bg-white/10 p-6 rounded-2xl backdrop-blur-md border border-white/10 text-center">
                    <p className="text-slate-300 text-sm mb-1 uppercase font-bold">Saldo Deudor Actual</p>
                    <p className={`text-4xl font-black ${totalDebt > 0 ? 'text-orange-400' : 'text-emerald-400'}`}>
                      ${totalDebt.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                {/* Visualización de la Gráfica */}
                <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
                  <h3 className="text-lg font-bold text-slate-700 mb-6 uppercase tracking-tight">Tendencia de Deuda</h3>
                  <div className="h-[400px]">
                    <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
                  </div>
                </div>

                {/* Tabla de Movimientos */}
                <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                  <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-700 uppercase text-sm">Últimos Movimientos</h3>
                    <span className="bg-blue-100 text-blue-700 text-xs font-black px-3 py-1 rounded-full">
                      {historial.length} REGISTROS
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-slate-400 text-xs font-bold uppercase">
                          <th className="p-5">Fecha</th>
                          <th className="p-5">Concepto</th>
                          <th className="p-5">Método</th>
                          <th className="p-5 text-right">Monto</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {historial.slice().reverse().map((item, idx) => (
                          <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                            <td className="p-5 text-slate-600 font-medium">
                              {new Date(item.fecha).toLocaleDateString("es-MX")}
                            </td>
                            <td className="p-5 font-bold text-slate-800">{item.tipo}</td>
                            <td className="p-5">
                              <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500 font-bold uppercase">
                                {item.metodo}
                              </span>
                            </td>
                            <td className={`p-5 text-right font-black text-lg ${item.monto < 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                              {item.monto < 0 ? `-$${Math.abs(item.monto).toFixed(2)}` : `+$${item.monto.toFixed(2)}`}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Pagos;