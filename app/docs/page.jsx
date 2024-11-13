"use client";
/**
 * Componente UploadPage
 * 
 * Este componente de React permite a los usuarios gestionar archivos en un bucket de S3, proporcionando funcionalidades
 * para subir, eliminar y listar archivos con una barra de progreso para los archivos que se están cargando.
 * También incluye una referencia para limpiar el input de archivo después de cada carga.
 * 
 * Estados:
 * - `file`: Almacena el archivo seleccionado para subir.
 * - `fileName`: Almacena el nombre del archivo seleccionado para eliminar.
 * - `files`: Lista de archivos actuales en el bucket de S3.
 * - `message`: Mensaje de estado para mostrar resultados al usuario (éxito o error).
 * - `uploadedUrl`: URL del archivo subido, para verlo o descargarlo.
 * - `uploadProgress`: Estado que rastrea el progreso de la carga del archivo (porcentaje de 0 a 100).
 * 
 * Referencia (useRef):
 * - `fileInputRef`: Referencia al input de archivo (`<input type="file">`). Se utiliza para limpiar el valor del input 
 *   después de una carga exitosa, permitiendo que el input se "reinicie" visualmente.
 * 
 * Efecto (useEffect):
 * - `useEffect(() => { fetchFiles(); }, [])`: Carga la lista de archivos cuando el componente se monta.
 *   Llama a la función `fetchFiles` para obtener los archivos actuales en el bucket de S3.
 * 
 * Funciones del Componente:
 * 
 * - `fetchFiles`: Obtiene la lista de archivos del bucket de S3 llamando a un endpoint de la API (`/api/s3/upload?list=true`),
 *   y actualiza el estado `files`. Muestra un mensaje de error si la solicitud falla.
 * 
 * - `handleFileChange`: Maneja la selección de un archivo nuevo para subir. Actualiza `file` y `fileName` con el archivo
 *   seleccionado. Se activa cuando el usuario selecciona un archivo en el input de archivo.
 * 
 * - `handleUpload`: Sube el archivo seleccionado a S3. Usa `XMLHttpRequest` para manejar la carga con un evento de progreso
 *   (`onprogress`) y actualizar `uploadProgress` en tiempo real. Después de una carga exitosa:
 *   - Muestra un mensaje de éxito.
 *   - Actualiza la lista de archivos llamando a `fetchFiles`.
 *   - Restablece `uploadProgress` y el input de archivo utilizando `fileInputRef`.
 * 
 * - `handleDelete`: Elimina el archivo seleccionado en `fileName` llamando al endpoint `/api/s3/upload?fileName=${fileName}` 
 *   con el método `DELETE`. Luego, refresca la lista de archivos llamando a `fetchFiles`.
 * 
 * Renderización del Componente:
 * 
 * - Lista Desplegable (Select): Muestra la lista de archivos actuales en el bucket. Al seleccionar un archivo, se actualiza
 *   `fileName`, lo que habilita el botón de "Eliminar".
 * 
 * - Botón de Eliminar: Disponible solo si `fileName` tiene un valor. Llama a `handleDelete` para eliminar el archivo seleccionado.
 * 
 * - Input de Archivo y Botón de Subir:
 *   - El input permite al usuario seleccionar un archivo para subir.
 *   - El botón llama a `handleUpload` para subir el archivo.
 * 
 * - Barra de Progreso: Visible solo mientras `uploadProgress` sea mayor que 0. Muestra el progreso de la carga en porcentaje,
 *   y se reinicia una vez completada la carga.
 * 
 * Mensajes y Enlaces:
 * - `message`: Muestra mensajes de éxito o error al usuario.
 * - `uploadedUrl`: Si un archivo se sube exitosamente, muestra un enlace para acceder al archivo en S3.
 * 
 * Este componente está diseñado para simplificar la administración de archivos en un bucket S3, brindando a los usuarios un 
 * manejo intuitivo de carga y eliminación, con retroalimentación visual de progreso en tiempo real.
 */

import React, { useState, useEffect, useRef } from "react";

export default function UploadPage() {
    const [file, setFile] = useState(null);
    const [fileName, setFileName] = useState("");
    const [files, setFiles] = useState([]);
    const [message, setMessage] = useState("");
    const [uploadedUrl, setUploadedUrl] = useState("");
    const [uploadProgress, setUploadProgress] = useState(0);
    
    // Referencia al input de archivo
    const fileInputRef = useRef(null);

    // Obtener la lista de archivos al cargar el componente
    useEffect(() => {
        fetchFiles();
    }, []);

    // Función para obtener la lista de archivos
    const fetchFiles = async () => {
        try {
            const response = await fetch("/api/s3/upload?list=true", {
                method: "GET",
            });
            const data = await response.json();
            setFiles(data.files);
        } catch (error) {
            console.error("Error al listar los archivos:", error);
            setMessage("Error al listar los archivos.");
        }
    };

    // Maneja el cambio de archivo seleccionado
    const handleFileChange = (event) => {
        setFile(event.target.files[0]);
        setFileName(event.target.files[0].name);
    };

    // Sube un nuevo archivo a S3 con barra de progreso
    const handleUpload = async () => {
        if (!file) {
            setMessage("Por favor selecciona un archivo.");
            return;
        }

        try {
            const response = await fetch("/api/s3/upload", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: file.name,
                    type: file.type,
                }),
            });
            const { url } = await response.json();

            // Usar XMLHttpRequest para manejar la carga con progreso
            const xhr = new XMLHttpRequest();
            xhr.open("PUT", url, true);
            xhr.setRequestHeader("Content-Type", file.type);

            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percentComplete = Math.round((event.loaded / event.total) * 100);
                    setUploadProgress(percentComplete);
                }
            };

            xhr.onload = () => {
                if (xhr.status === 200) {
                    setMessage("Archivo subido con éxito!");
                    setUploadedUrl(url.split("?")[0]);
                    fetchFiles(); // Refrescar la lista de archivos
                    setUploadProgress(0); // Reiniciar el progreso

                    // Limpiar el input de archivo
                    setFile(null);
                    setFileName("");
                    if (fileInputRef.current) {
                        fileInputRef.current.value = null; // Limpiar visualmente el input
                    }
                } else {
                    setMessage("Error al subir el archivo.");
                }
            };

            xhr.onerror = () => {
                setMessage("Error al subir el archivo.");
                setUploadProgress(0);
            };

            xhr.send(file);
        } catch (error) {
            console.error("Error al subir el archivo:", error);
            setMessage("Error al subir el archivo.");
        }
    };

    // Elimina el archivo seleccionado
    const handleDelete = async () => {
        if (!fileName) {
            setMessage("Selecciona un archivo para eliminar.");
            return;
        }

        try {
            const response = await fetch(`/api/s3/upload?fileName=${fileName}`, {
                method: "DELETE",
            });
            const data = await response.json();

            setMessage(data.message || "Archivo eliminado con éxito.");
            setUploadedUrl("");
            fetchFiles(); // Refrescar la lista de archivos
        } catch (error) {
            console.error("Error al eliminar el archivo:", error);
            setMessage("Error al eliminar el archivo.");
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white p-6 rounded-lg shadow-md w-80">
                <h2 className="text-2xl font-semibold mb-4 text-center">Gestión de Archivos</h2>

                {/* Select para seleccionar archivos */}
                <label className="block mb-2">Selecciona un archivo:</label>
                <select
                    className="w-full mb-4 border border-gray-300 rounded-lg p-2"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                >
                    <option value="">Seleccione un archivo</option>
                    {files.map((file) => (
                        <option key={file.name} value={file.name}>
                            {file.name}
                        </option>
                    ))}
                </select>

                {/* Botón de eliminar */}
                {fileName && (
                    <button
                        onClick={handleDelete}
                        className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition duration-300 mb-4"
                    >
                        Eliminar
                    </button>
                )}

                {/* Subir un nuevo archivo */}
                <div className="mt-6">
                    <label className="block mb-2">Subir un nuevo archivo:</label>
                    <input
                        type="file"
                        onChange={handleFileChange}
                        ref={fileInputRef} // Referencia para limpiar el input
                        className="w-full mb-4 border border-gray-300 rounded-lg p-2"
                    />
                    <button
                        onClick={handleUpload}
                        className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition duration-300"
                    >
                        Subir
                    </button>

                    {/* Barra de progreso */}
                    {uploadProgress > 0 && (
                        <div className="w-full bg-gray-200 rounded-full h-4 mt-4">
                            <div
                                className="bg-blue-500 h-4 rounded-full"
                                style={{ width: `${uploadProgress}%` }}
                            ></div>
                        </div>
                    )}
                </div>

                {message && <p className="text-center mt-4">{message}</p>}
                {uploadedUrl && (
                    <p className="text-center mt-2 text-blue-500 underline">
                        <a href={uploadedUrl} target="_blank" rel="noopener noreferrer">
                            Ver archivo
                        </a>
                    </p>
                )}
            </div>
        </div>
    );
}
