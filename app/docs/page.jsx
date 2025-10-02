"use client";

import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext.js";
import { useRouter } from "next/navigation";

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [files, setFiles] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [message, setMessage] = useState("");
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loadingList, setLoadingList] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login");
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        setLoadingList(true);
        const res = await fetch("/api/s3/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ patients: [], therapists: [] }),
        });
        const data = await res.json();
        setFiles(Array.isArray(data.documents) ? data.documents : []);
      } catch {
        setFiles([]);
        setMessage("No se pudieron cargar los documentos.");
      } finally {
        setLoadingList(false);
      }
    };
    fetchFiles();
  }, []);

  if (isLoading) return <p className="p-6 text-center">Cargando…</p>;
  if (!isAuthenticated) return null;

  const prettyName = (d) => {
    if (d?.name) return d.name;
    if (d?.key) return d.key;
    try {
      const u = new URL(d?.url || "");
      return decodeURIComponent(u.pathname.split("/").pop() || "archivo");
    } catch {
      return d?.url || "archivo";
    }
  };

  const onChangeFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setUploadedUrl("");
    setMessage("");
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage("Selecciona un archivo.");
      return;
    }
    setUploading(true);
    setMessage("");
    try {
      const res = await fetch("/api/s3/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: file.name, type: file.type }),
      });
      const { url } = await res.json();

      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", url, true);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable) {
            setUploadProgress(Math.round((evt.loaded / evt.total) * 100));
          }
        };
        xhr.onload = () => (xhr.status === 200 ? resolve() : reject());
        xhr.onerror = reject;
        xhr.send(file);
      });

      setUploadedUrl(url.split("?")[0]);
      setMessage("Archivo subido a S3.");
      setUploadProgress(0);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = null;
    } catch {
      setMessage("Error al subir el archivo.");
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) {
      setMessage("Selecciona un documento.");
      return;
    }
    const doc = files.find((d) => d._id === selectedId);
    if (!doc) {
      setMessage("Documento no encontrado.");
      return;
    }
    setDeleting(true);
    setMessage("");
    try {
      const res = await fetch("/api/s3/documents", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: doc._id, key: doc.key }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "No se pudo eliminar");
      setFiles((prev) => prev.filter((f) => f._id !== doc._id));
      setSelectedId("");
      setUploadedUrl("");
      setMessage("Documento eliminado.");
    } catch {
      setMessage("Error al eliminar el documento.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 space-y-6">
        <h2 className="text-2xl font-bold text-center">Gestión de Archivos</h2>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Selecciona un documento</label>
          <div className="flex gap-2">
            <select
              className="w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              disabled={loadingList}
            >
              <option value="">{loadingList ? "Cargando…" : "Seleccione un documento"}</option>
              {files.map((d) => (
                <option key={d._id || d.key || d.name} value={d._id}>
                  {prettyName(d)}
                </option>
              ))}
            </select>
            <button
              onClick={handleDelete}
              disabled={!selectedId || deleting}
              className="whitespace-nowrap rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600 disabled:opacity-50"
            >
              {deleting ? "Eliminando…" : "Eliminar"}
            </button>
          </div>
        </div>

        <div className="border-t pt-4 space-y-3">
          <label className="text-sm font-medium text-gray-700">Subir a S3</label>
          <input
            type="file"
            onChange={onChangeFile}
            ref={fileInputRef}
            className="w-full rounded-lg border border-gray-300 p-2"
          />
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {uploading ? "Subiendo…" : "Subir"}
          </button>

          {uploadProgress > 0 && (
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-2 bg-indigo-600" style={{ width: `${uploadProgress}%` }} />
            </div>
          )}
        </div>

        {uploadedUrl && (
          <a
            href={uploadedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center text-indigo-600 hover:underline"
          >
            Ver archivo subido
          </a>
        )}

        {!!message && (
          <p className="text-center text-sm text-gray-700 bg-gray-50 border rounded-lg p-2">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
