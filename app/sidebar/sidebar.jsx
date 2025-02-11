"use client";

import React from "react";
import Link from "next/link";
import {
  HomeIcon,
  UserPlusIcon,
  UsersIcon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  ChatBubbleLeftRightIcon,
  DocumentChartBarIcon,
  CreditCardIcon,
  ArchiveBoxIcon,
  DocumentTextIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  DocumentIcon,
} from "@heroicons/react/24/outline";
import { User } from "lucide-react";
import { useAuth } from "../context/AuthContext.js"; // Importa el contexto de autenticación.

const Sidebar = () => {
  // Extrae el estado de autenticación y la función logout desde el contexto de autenticación.
  const { isAuthenticated, logout } = useAuth(); // Usa el estado de autenticación del contexto

  return (
    <div className="h-full bg-gray-800 text-white w-64 flex flex-col">
      <div className="p-4 text-2xl font-semibold">CAF TESTS</div>
      <nav className="mt-8 flex-1">
        <ul>
          <li className="mb-4">
            <Link
              href="/"
              className=" px-4 py-2 hover:bg-gray-700 rounded flex items-center"
            >
              <HomeIcon className="h-5 w-5 mr-3" />
              Inicio
            </Link>
          </li>
          {/* Enlace visible solo si el usuario no está autenticado */}
          {!isAuthenticated && (
            <li className="mb-4">
              <Link
                href="/login"
                className=" px-4 py-2 hover:bg-gray-700 rounded flex items-center"
              >
                <User className="h-5 w-5 mr-3" />
                Iniciar Sesión
              </Link>
            </li>
          )}

          {/* Opciones visibles solo si el usuario está autenticado */}
          {isAuthenticated && (
            <>
              {/* Opción de Cerrar Sesión */}
              <li className="mb-4">
                <button
                  onClick={logout}
                  className="w-full px-4 py-2 hover:bg-gray-700 rounded flex items-center text-left"
                >
                  <User className="h-5 w-5 mr-3" />
                  Cerrar Sesión
                </button>
              </li>

              <li className="mb-4">
                <Link
                  href="/registropacientes"
                  className=" px-4 py-2 hover:bg-gray-700 rounded flex items-center"
                >
                  <UserPlusIcon className="h-5 w-5 mr-3" />
                  Registro Clientes
                </Link>
              </li>
              <li className="mb-4">
                <Link
                  href="/registroterapeuta"
                  className=" px-4 py-2 hover:bg-gray-700 rounded flex items-center"
                >
                  <UsersIcon className="h-5 w-5 mr-3" />
                  Registro Terapeutas
                </Link>
              </li>
              <li className="mb-4">
                <Link
                  href="/citas"
                  className=" px-4 py-2 hover:bg-gray-700 rounded flex items-center"
                >
                  <CalendarDaysIcon className="h-5 w-5 mr-3" />
                  Citas
                </Link>
              </li>
              <li className="mb-4">
                <Link
                  href="/agendas"
                  className=" px-4 py-2 hover:bg-gray-700 rounded flex items-center"
                >
                  <ClipboardDocumentListIcon className="h-5 w-5 mr-3" />
                  Agendas
                </Link>
              </li>
              <li className="mb-4">
                <Link
                  href="/terapeuta"
                  className="px-4 py-2 hover:bg-gray-700 rounded flex items-center"
                >
                  <UsersIcon className="h-5 w-5 mr-3" />
                  Terapeuta
                </Link>
              </li>
              <li className="mb-4">
                <Link
                  href="/pacientes"
                  className="px-4 py-2 hover:bg-gray-700 rounded flex items-center"
                >
                  <UsersIcon className="h-5 w-5 mr-3" />
                  Pacientes
                </Link>
              </li>
              <li className="mb-4">
                <Link
                  href="/mensajes"
                  className="px-4 py-2 hover:bg-gray-700 rounded flex items-center"
                >
                  <ChatBubbleLeftRightIcon className="h-5 w-5 mr-3" />
                  Mensajes
                </Link>
              </li>
              <li className="mb-4">
                <Link
                  href="/reporte"
                  className=" px-4 py-2 hover:bg-gray-700 rounded flex items-center"
                >
                  <DocumentChartBarIcon className="h-5 w-5 mr-3" />
                  Reportes
                </Link>
              </li>
              <li className="mb-4">
                <Link
                  href="/pagos"
                  className=" px-4 py-2 hover:bg-gray-700 rounded flex items-center"
                >
                  <CreditCardIcon className="h-5 w-5 mr-3" />
                  Pagos
                </Link>
              </li>
              <li className="mb-4">
                <Link
                  href="/almacen"
                  className=" px-4 py-2 hover:bg-gray-700 rounded flex items-center"
                >
                  <ArchiveBoxIcon className="h-5 w-5 mr-3" />
                  Almacen
                </Link>
              </li>
              <li className="mb-4">
                <Link
                  href="/documentador"
                  className=" px-4 py-2 hover:bg-gray-700 rounded flex items-center"
                >
                  <DocumentTextIcon className="h-5 w-5 mr-3" />
                  Documentador
                </Link>
              </li>
              <li className="mb-4">
                <Link
                  href="/usuarios"
                  className=" px-4 py-2 hover:bg-gray-700 rounded flex items-center"
                >
                  <UserGroupIcon className="h-5 w-5 mr-3" />
                  Usuarios
                </Link>
              </li>
              <li className="mb-4">
                <Link
                  href="/ajustes"
                  className=" px-4 py-2 hover:bg-gray-700 rounded flex items-center"
                >
                  <Cog6ToothIcon className="h-5 w-5 mr-3" />
                  Ajustes
                </Link>
              </li>
              <li>
                <Link
                  href="/docs"
                  className=" px-4 py-2 hover:bg-gray-700 rounded flex items-center"
                >
                  <DocumentIcon className="h-5 w-5 mr-3" />
                  Documentos
                </Link>
              </li>
            </>
          )}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
