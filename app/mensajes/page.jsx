"use client";
import { useEffect, useState, useRef, useMemo } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:3001", {
  autoConnect: false,
  transports: ["websocket", "polling"]
});

const Mensajes = () => {
  const { userId, userName, userRole: role } = useAuth();
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [receptor, setReceptor] = useState("");
  const [usuarios, setUsuarios] = useState([]);
  const [seleccionados, setSeleccionados] = useState([]);
  const [notificaciones, setNotificaciones] = useState({});
  const [ultimosMensajes, setUltimosMensajes] = useState({}); // { userId: {content, timestamp} }
  const [modoComunicado, setModoComunicado] = useState(false);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  // 1. CARGA INICIAL Y PRECARGA DE CHATS
  useEffect(() => {
    const inicializarDatos = async () => {
      try {
        // Cargar lista de usuarios (Terapeuta o Paciente)
        const endpoint = role === "patient" ? "/api/therapist" : "/api/patient";
        const resUsers = await axios.get(endpoint);
        const list = role === "patient" ? resUsers.data?.therapist || [] : resUsers.data?.patient || [];
        setUsuarios(list);

        // PRECARGA: Obtenemos el último mensaje de cada chat para ordenar el Inbox
        // Nota: Este endpoint debe devolver un objeto donde la llave es el ID del usuario
        const resPreviews = await axios.get(`/api/messages/previews?userId=${userId}`);
        if (resPreviews.data?.previews) {
          setUltimosMensajes(resPreviews.data.previews);
        }
      } catch (error) {
        console.error("Error en la precarga del chat:", error);
      }
    };
    if (role && userId) inicializarDatos();
  }, [role, userId]);

  // 2. ORDENAMIENTO DINÁMICO (Los más recientes siempre arriba)
  const usuariosOrdenados = useMemo(() => {
    return [...usuarios].sort((a, b) => {
      const timeA = new Date(ultimosMensajes[a._id]?.timestamp || 0).getTime();
      const timeB = new Date(ultimosMensajes[b._id]?.timestamp || 0).getTime();
      return timeB - timeA;
    });
  }, [usuarios, ultimosMensajes]);

  // 3. SOCKET: Escucha activa y actualización de posición
  useEffect(() => {
    if (!userId) return;
    if (!socket.connected) socket.connect();
    socket.emit("registrar", userId);

    const recibirMensaje = (mensaje) => {
      const idChat = mensaje.from === userId ? mensaje.to : mensaje.from;

      // Actualizamos el preview: Esto hace que el usuario suba al tope de la lista
      setUltimosMensajes(prev => ({
        ...prev,
        [idChat]: {
          content: mensaje.type === "image" ? "📷 Foto" : mensaje.content,
          timestamp: mensaje.timestamp
        }
      }));

      if (idChat === receptor) {
        setMensajes((prev) => [...prev, mensaje]);
      } else {
        setNotificaciones(prev => ({ ...prev, [idChat]: (prev[idChat] || 0) + 1 }));
      }
    };

    socket.on("mensaje", recibirMensaje);
    return () => socket.off("mensaje", recibirMensaje);
  }, [userId, receptor]);

  // 4. Carga de historial al seleccionar un usuario
  useEffect(() => {
    if (!userId || !receptor) return;
    const fetchHistorial = async () => {
      try {
        const res = await axios.get(`/api/messages?userId=${userId}&receptor=${receptor}`);
        const history = res.data.messages || [];
        setMensajes(history);
        setNotificaciones(prev => ({ ...prev, [receptor]: 0 }));
      } catch (err) { console.error(err); }
    };
    fetchHistorial();
  }, [userId, receptor]);

  // 5. Scroll automático al recibir mensajes
  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth" }); }, [mensajes]);

  // Handlers
  const enviarMensaje = () => {
    if (!nuevoMensaje.trim() || !receptor) return;
    const msg = { from: userId, fromName: userName, to: receptor, content: nuevoMensaje, type: "text", timestamp: new Date().toISOString() };
    socket.emit("mensaje", msg);
    setMensajes(prev => [...prev, msg]);
    setUltimosMensajes(prev => ({ ...prev, [receptor]: { content: nuevoMensaje, timestamp: msg.timestamp } }));
    setNuevoMensaje("");
  };

  const enviarMasivo = () => {
    if (!nuevoMensaje.trim() || seleccionados.length === 0) return;
    const timestamp = new Date().toISOString();
    seleccionados.forEach(id => {
      socket.emit("mensaje", { from: userId, fromName: userName, to: id, content: nuevoMensaje, type: "text", timestamp });
    });
    alert(`📢 Comunicado enviado a ${seleccionados.length} usuarios`);
    setNuevoMensaje("");
    setSeleccionados([]);
    setModoComunicado(false);
  };

  return (
    <div className="flex h-[88vh] bg-white border border-zinc-200 rounded-3xl mx-2 md:mx-10 my-4 shadow-2xl overflow-hidden font-sans text-zinc-800">
      
      {/* SIDEBAR / INBOX */}
      <div className="w-1/3 border-r border-zinc-100 bg-zinc-50 flex flex-col">
        {/* Header Perfil */}
        <div className="p-5 border-b border-zinc-200 bg-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-sky-500 text-white flex items-center justify-center font-bold shadow-inner">
              {userName?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-zinc-400 font-bold uppercase">Sesión de</p>
              <p className="text-sm font-black truncate">{userName}</p>
            </div>
          </div>
          <button 
            onClick={() => { setModoComunicado(true); setReceptor(""); }}
            className="w-full py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-[11px] font-bold transition-all shadow-md shadow-sky-100 uppercase"
          >
            📢 Crear Comunicado
          </button>
        </div>

        {/* Lista de Usuarios Dinámica */}
        <div className="overflow-y-auto flex-1 bg-white">
          {usuariosOrdenados.map((u) => (
            <div
              key={u._id}
              onClick={() => { setReceptor(u._id); setModoComunicado(false); }}
              className={`p-4 flex items-center gap-3 cursor-pointer border-b border-zinc-50 transition-all
                ${receptor === u._id && !modoComunicado ? "bg-sky-50 border-r-4 border-r-sky-500" : "hover:bg-zinc-50"}`}
            >
              <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center font-bold text-zinc-400 border">
                {u.firstName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <p className="font-bold text-sm truncate">{u.firstName} {u.lastName}</p>
                  <span className="text-[9px] text-zinc-400">
                    {ultimosMensajes[u._id] ? new Date(ultimosMensajes[u._id].timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ""}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <p className={`text-xs truncate ${notificaciones[u._id] > 0 ? "text-sky-600 font-bold" : "text-zinc-400"}`}>
                    {ultimosMensajes[u._id]?.content || "Sin mensajes aún"}
                  </p>
                  {notificaciones[u._id] > 0 && (
                    <span className="bg-sky-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold animate-pulse">
                      {notificaciones[u._id]}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ÁREA DE CHAT */}
      <div className="flex-1 flex flex-col bg-white">
        {modoComunicado ? (
          /* VISTA COMUNICADO */
          <div className="flex-1 p-10 flex flex-col items-center justify-center bg-zinc-50/50">
            <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-zinc-100">
              <h3 className="text-xl font-bold mb-4 text-center">Nuevo Comunicado 📢</h3>
              <div className="grid grid-cols-2 gap-2 mb-4 max-h-40 overflow-y-auto p-3 border rounded-2xl bg-zinc-50">
                {usuarios.map(u => (
                  <label key={u._id} className="flex items-center gap-2 p-1 cursor-pointer hover:bg-white rounded-lg transition-colors">
                    <input type="checkbox" className="rounded text-sky-500" checked={seleccionados.includes(u._id)} onChange={() => {
                      setSeleccionados(prev => prev.includes(u._id) ? prev.filter(id => id !== u._id) : [...prev, u._id]);
                    }} />
                    <span className="text-[11px] text-zinc-600 truncate">{u.firstName}</span>
                  </label>
                ))}
              </div>
              <textarea 
                className="w-full p-4 bg-zinc-100 border-none rounded-2xl focus:ring-2 focus:ring-sky-400 outline-none text-sm mb-4 resize-none h-32"
                placeholder="Escribe el aviso aquí..."
                value={nuevoMensaje}
                onChange={(e) => setNuevoMensaje(e.target.value)}
              />
              <div className="flex gap-2">
                <button onClick={() => setModoComunicado(false)} className="flex-1 py-3 text-zinc-400 font-bold text-sm">Cancelar</button>
                <button onClick={enviarMasivo} disabled={seleccionados.length === 0 || !nuevoMensaje.trim()} className="flex-1 py-3 bg-sky-500 text-white rounded-2xl font-bold disabled:opacity-50 shadow-lg shadow-sky-100 transition-opacity">
                  Enviar a {seleccionados.length}
                </button>
              </div>
            </div>
          </div>
        ) : receptor ? (
          /* VISTA CHAT ACTIVO */
          <>
            <div className="px-8 py-5 border-b border-zinc-100 flex items-center gap-4 bg-white/80 backdrop-blur-md">
              <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center font-bold text-zinc-400 border uppercase">
                {usuarios.find(u => u._id === receptor)?.firstName[0]}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-zinc-800">
                  {usuarios.find(u => u._id === receptor)?.firstName} {usuarios.find(u => u._id === receptor)?.lastName}
                </h4>
                <p className="text-[10px] text-sky-500 font-bold uppercase tracking-widest">En línea ahora</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-zinc-50/20">
              {mensajes.map((msg, idx) => {
                const isMine = msg.from === userId;
                return (
                  <div key={idx} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] p-3 rounded-2xl shadow-sm text-sm ${
                      isMine ? "bg-sky-500 text-white rounded-br-none" : "bg-white text-zinc-700 border border-zinc-100 rounded-bl-none"
                    }`}>
                      {msg.type === "image" ? <img src={msg.content} className="rounded-xl max-w-xs mb-1 shadow-sm" /> : <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>}
                      <p className={`text-[9px] mt-1 opacity-60 ${isMine ? "text-right" : "text-left"}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={scrollRef} />
            </div>

            <div className="p-4 bg-white border-t border-zinc-100">
              <div className="flex items-center gap-2 bg-zinc-100 p-2 rounded-2xl">
                <button onClick={() => fileInputRef.current.click()} className="p-2 text-zinc-400 hover:text-sky-500 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                  const file = e.target.files[0];
                  if(file){
                    const reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onload = () => {
                      const msg = { from: userId, fromName: userName, to: receptor, content: reader.result, type: "image", timestamp: new Date().toISOString() };
                      socket.emit("mensaje", msg);
                      setMensajes(prev => [...prev, msg]);
                    };
                  }
                }} />
                <input
                  value={nuevoMensaje}
                  onChange={(e) => setNuevoMensaje(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && enviarMensaje()}
                  className="flex-1 bg-transparent border-none px-2 text-sm focus:ring-0 outline-none"
                  placeholder="Escribe un mensaje..."
                />
                <button onClick={enviarMensaje} className="p-2.5 bg-sky-500 text-white rounded-xl shadow-lg hover:bg-sky-600 active:scale-95 transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                </button>
              </div>
            </div>
          </>
        ) : (
          /* VISTA VACÍA */
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-300">
            <svg className="w-20 h-20 mb-4 opacity-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"></path></svg>
            <p className="text-zinc-400 font-medium">Selecciona una conversación para empezar</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Mensajes;