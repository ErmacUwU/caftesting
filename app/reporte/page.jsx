"use client"; // Indica que este componente debe ser renderizado en el cliente
import React, { useState, useEffect, useRef } from 'react'; // Importa las utilidades de React
import axios from 'axios'; // Importa Axios para realizar solicitudes HTTP
import html2pdf from 'html2pdf.js'; // Importa html2pdf.js

const Reporte = () => {
  // Definir estados para almacenar citas, terapeutas, paciente, cita, notas e imágenes
  const [appointments, setAppointments] = useState([]); // Citas obtenidas de la API
  const [selectedTherapist, setSelectedTherapist] = useState(''); // Terapeuta seleccionado
  const [selectedPatient, setSelectedPatient] = useState(''); // Paciente seleccionado
  const [selectedAppointment, setSelectedAppointment] = useState(''); // Cita seleccionada
  const [notes, setNotes] = useState(''); // Notas ingresadas por el usuario
  const [images, setImages] = useState([]); // Almacena las URL de las imágenes
  const pdfRef = useRef(); // Referencia al contenido que se quiere exportar a PDF

  // Función para cargar datos de citas desde la API al montar el componente
  useEffect(() => {
    const fetchData = async () => {
      try {
        const appointmentsRes = await axios.get("/api/date"); // Realiza la solicitud a la API
        setAppointments(
          appointmentsRes.data.date.map((appointment) => ({
            id: appointment.idDate,
            title: appointment.title,
            date: appointment.date,
            therapist: appointment.therapist,
            patient: appointment.patient,
            description: appointment.description,
            cost: appointment.cost,
          })) || []
        );
      } catch (error) {
        console.error("Error fetching data:", error); // Manejo de errores
      }
    };

    fetchData(); // Llama a la función al montar el componente
  }, []);

  // Extraer terapeutas únicos de las citas
  const uniqueTherapists = [...new Set(appointments.map(appointment => appointment.therapist))];
  // Extraer pacientes únicos de las citas
  const uniquePatients = [...new Set(appointments.map(appointment => appointment.patient))];

  // Filtrar las citas según el terapeuta y el paciente seleccionados
  const filteredAppointments = appointments.filter(appointment => {
    return (
      (selectedTherapist ? appointment.therapist === selectedTherapist : true) && 
      (selectedPatient ? appointment.patient === selectedPatient : true)
    );
  });

  // Función para manejar la carga de imágenes
  const handleImageChange = (event) => {
    const files = Array.from(event.target.files);
    const newImages = files.map(file => URL.createObjectURL(file));
    setImages(prevImages => [...prevImages, ...newImages]);
  };

  // Descargar el PDF con la información seleccionada
  const downloadPDF = () => {
    const element = pdfRef.current; // Referencia al contenido a exportar
    const options = {
      margin: 1,
      filename: 'reporte_citas.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf()
      .from(element) // Captura el contenido del elemento referenciado
      .set(options) // Establece las opciones
      .save(); // Guarda el PDF generado
  };

  return (
    <div className="p-4 bg-gray-50 rounded shadow-lg"> {/* Fondo mejorado y bordes redondeados */}
      <h1 className="text-2xl font-bold mb-5 text-center">Creador de Reportes para Citas</h1>
      
      {/* Selector para elegir el terapeuta */}
      <label htmlFor="therapists" className="block mb-1 font-semibold">Elige el doctor:</label>
      <select 
          id="therapists" 
          value={selectedTherapist} 
          onChange={(e) => setSelectedTherapist(e.target.value)}
          className="border border-gray-400 p-2 rounded mb-4 w-full"
        >
        <option value="">--Seleccione un terapeuta--</option>
        {uniqueTherapists.map((therapist, index) => (
          <option key={index} value={therapist}>
            {therapist}
          </option>
        ))}
      </select>

      {/* Selector para elegir el paciente */}
      <label htmlFor="patients" className="block mb-1 font-semibold">Elige el paciente:</label>
      <select 
          id="patients" 
          value={selectedPatient} 
          onChange={(e) => setSelectedPatient(e.target.value)} 
          className="border border-gray-400 p-2 rounded mb-4 w-full"
      >
        <option value="">--Seleccione un paciente--</option>
        {uniquePatients.map((patient, index) => (
          <option key={index} value={patient}>
            {patient}
          </option>
        ))}
      </select>

      {/* Selector para elegir la cita */}
      <label htmlFor="appointments" className="block mb-1 font-semibold">Elige la cita:</label>
      <select 
          id="appointments" 
          value={selectedAppointment} 
          onChange={(e) => setSelectedAppointment(e.target.value)} 
          className="border border-gray-400 p-2 rounded mb-4 w-full"
      >
        <option value="">--Seleccione una cita--</option>
        {filteredAppointments.map(appointment => (
          <option key={appointment.id} value={appointment.id}>
            {appointment.title} - {appointment.date}
          </option>
        ))}
      </select>

      {/* Campo de texto para ingresar notas */}
      <label htmlFor="notes" className="block mb-1 font-semibold">Notas:</label>
      <textarea 
          id="notes" 
          value={notes} 
          onChange={(e) => setNotes(e.target.value)} 
          className="border border-gray-400 p-2 rounded mb-4 w-full"
          placeholder="Ingresa tus notas aquí..."
          rows="4"
      />

      {/* Entrada de archivos para imágenes */}
      <label htmlFor="images" className="block mb-1 font-semibold">Agregar Imágenes:</label>
      <input 
          type="file" 
          id="images" 
          accept="image/*" 
          onChange={handleImageChange}
          multiple // Permite subir múltiples imágenes
          className="border border-gray-400 p-2 rounded mb-4 w-full"
      />

      {/* Vista previa de las imágenes seleccionadas */}
      <div className="flex flex-wrap mb-4">
        {images.map((img, index) => (
          <div key={index} className="m-1">
            <img src={img} alt={`preview-${index}`} className="w-24 h-24 object-cover border rounded" />
          </div>
        ))}
      </div>

      {/* Sección para mostrar resultados seleccionados */}
      <div className="mb-4 p-4 bg-white rounded shadow-sm">
        <h2 className="text-lg font-semibold">Resultados seleccionados:</h2>
        <p>Terapeuta seleccionado: <strong>{selectedTherapist || "Ninguno"}</strong></p>
        <p>Paciente seleccionado: <strong>{selectedPatient || "Ninguno"}</strong></p>
        <p>Cita seleccionada: <strong>{selectedAppointment || "Ninguna"}</strong></p>
      </div>

      <button 
          onClick={downloadPDF} 
          className="mt-4 w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        Descargar PDF
      </button>

      {/* Contenido a exportar a PDF */}
      <div ref={pdfRef} > 
        <h1 className="text-xl font-bold">Reporte de Citas</h1>
        <p><strong>Terapeuta:</strong> {selectedTherapist || "No hay terapeuta seleccionado"}</p>
        <p><strong>Paciente:</strong> {selectedPatient || "No hay paciente seleccionado"}</p>
        <p><strong>Cita:</strong> {selectedAppointment || "No hay cita seleccionada"}</p>
        <h2 className="text-lg font-semibold">Notas:</h2>
        <p>{notes || "No hay notas ingresadas"}</p>
        <h2 className="text-lg font-semibold">Imágenes:</h2>
        {images.length > 0 ? (
          images.map((img, index) => (
            <img key={index} src={img} alt={`uploaded-${index}`} className="mb-2" style={{ maxWidth: '100%', height: 'auto' }} />
          ))
        ) : (
          <p>No hay imágenes subidas.</p>
        )}
      </div>
    </div>
  );
};

export default Reporte;