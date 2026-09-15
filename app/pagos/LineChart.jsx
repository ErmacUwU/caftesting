"use client";

import { Line } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";

// chart.js + react-chartjs-2 viven en su propio chunk (cargado vía
// next/dynamic desde app/pagos/page.jsx) para no sumar su peso al bundle
// inicial de la vista de Pagos. El registro de Chart.js solo ocurre una
// vez que este módulo se carga.
Chart.register(...registerables);

export default function LineChart(props) {
  return <Line {...props} />;
}
