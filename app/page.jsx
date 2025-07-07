'use client';

import React from 'react';
import Image from 'next/image';
import child from './assets/images/bby.webp';

const Page = () => {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] px-4 py-10 text-white">
      {/* Sección principal: texto + imagen */}
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">
            Centro de Apoyo a la Familia
          </h1>
          <p className="text-lg md:text-xl text-white/80">
            Diagnóstico y acompañamiento terapéutico en lenguaje, psicología y aprendizaje para niños con Autismo, Déficit de atención, deficiencia intelectual y más.
          </p>
          <button className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-xl shadow-lg transition">
            Agenda tu cita
          </button>
        </div>

        <div className="flex justify-center">
          <Image
            src={child}
            alt="Ilustración gráfica"
            className="w-full max-w-md rounded-xl shadow-2xl"
          />
        </div>
      </div>

      {/* Línea divisora */}
      <div className="flex justify-center my-24">
        <div className="h-1 w-40 bg-pink-400 rounded-full shadow-lg"></div>
      </div>

      {/* Sección de Actualizaciones y Futuras Mejoras */}
      <div className="max-w-6xl mx-auto mt-20 grid md:grid-cols-2 gap-12">
        {/* Últimas Actualizaciones */}
        <section className="bg-white/5 backdrop-blur-sm text-white rounded-2xl shadow-xl p-8 space-y-4 border border-white/10">
          <h2 className="text-2xl font-bold text-black border-b border-black/30 pb-2">
            Últimas Actualizaciones
          </h2>
          <ul className="list-disc list-inside space-y-1 marker:text-black">
            <li>Implementación del CRUD completo.</li>
            <li>Opción para cambiar colores desde la edición del servicio en el calendario.</li>
            <li>Diseño en dos columnas (texto + imagen).</li>
            <li>Botón agenda tu cita con estilos mejorados y transición.</li>
            <li>Imagen decorativa (<code>child.webp</code>) agregada a la derecha.</li>
            <li>Integración de calendario dual.</li>
            <li>Exportación de gráficas como imagen.</li>
            <li>Gráfica de pagos mejorada y exportación a Excel con formato.</li>
            <li>Interfaz del sistema de pagos optimizada.</li>
            <li>Mejoras al editar citas y cambios en las alertas del sistema.</li>
            <li>Chat implementado al iniciar sesión.</li>
            <li>Traducción parcial del chat (TAUD).</li>
            <li>Implementación de una nueva rama con mejoras.</li>
            <li>Se añadió texto con el nombre "Centro Técnico".</li>
            <li>Diseño actualizado del chat.</li>
            <li>Comunicación básica entre paciente y terapeuta mediante el chat (mensaje enviado y recibido en consola).</li>
            <li>Visualización de citas ya aparece en el calendario con opción de modificar el nombre del terapeuta.</li>
            <li>Calendarios duales ahora funcionan por separado, cada uno puede modificarse individualmente.</li>
            <li>Selección de terapeutas implementada con un select en la edición de citas.</li>
            <li>Corrección de errores en los calendarios, especialmente al filtrar terapeutas.</li>
            <li>Al seleccionar un terapeuta, ahora se puede ver qué citas fueron creadas.</li>
            <li>Las citas ahora se pueden visualizar por semana y por día.</li>
          </ul>
        </section>

        {/* Futuras Mejoras */}
        <section className="bg-white/5 backdrop-blur-sm text-white rounded-2xl shadow-xl p-8 space-y-4 border border-white/10">
          <h2 className="text-2xl font-bold text-black border-b border-black/30 pb-2">
            Futuras Mejoras
          </h2>
          <ul className="list-disc list-inside space-y-1 marker:text-black">
            <li>Falta mejorar el sistema de citas del chat y actualizar correctamente el nombre del usuario autenticado.</li>
            <li>Corregir el margen y estilo en los nombres del chat al iniciar sesión.</li>
            <li>Almacenar los mensajes del chat en MongoDB de forma persistente.</li>
            <li>Guardar y mostrar el nombre del usuario autenticado en los mensajes.</li>
            <li>Permitir mensajería entre pacientes y terapeutas según su rol.</li>
            <li>Modificar el diseño del chat para distinguir claramente entre mensajes de paciente y terapeuta.</li>
            <li>Unificar ramas actuales en una versión estable.</li>
            <li>Mejorar la interfaz de mensajería del chats para que sea más clara y moderna.</li>
          </ul>
        </section>
      </div>

      {/* Pie de página */}
      <div className="mt-20 text-center text-sm text-white/60">
        Desarrollado por Judith Adilene Andrade Perez
      </div>
    </div>
  );
};

export default Page;
