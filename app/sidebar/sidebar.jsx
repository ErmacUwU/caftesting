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
  const { isAuthenticated, logout } = useAuth();

  return (
    <div className="flex flex-col  min-h-5 p-5">
      <div className="bg-transparent text-white h-16 items-center justify-between px-4">
        <div className="text-2xl font-semibold">CAF TESTS</div>
      </div>
      <nav className="flex flex-row">
        <ul className="flex flex-col space-y-2">
          <li>
            <Link href="/" className="px-4 py-2 hover:bg-gray-700 rounded flex items-center">
              <HomeIcon className="h-5 w-5 mr-3" />
              Inicio
            </Link>
          </li>

          {!isAuthenticated && (
            <li>
              <Link href="/login" className="px-4 py-2 hover:bg-gray-700 rounded flex items-center">
                <User className="h-5 w-5 mr-3" />
                Iniciar Sesión
              </Link>
            </li>
          )}

          {isAuthenticated && (
            <>
              <li>
                <button onClick={logout} className="px-4 py-2 hover:bg-gray-700 rounded flex items-center w-full text-left">
                  <User className="h-5 w-5 mr-3" />
                  Cerrar Sesión
                </button>
              </li>

              <div className="mt-4">
                <h3 className="px-4 py-2 text-sm font-semibold text-gray-400 uppercase">Registros</h3>
                <li>
                  <Link href="/registropacientes" className="px-4 py-2 hover:bg-gray-700 rounded flex items-center">
                    <UserPlusIcon className="h-5 w-5 mr-3" />
                    Registro Clientes
                  </Link>
                </li>
                <li>
                  <Link href="/registroterapeuta" className="px-4 py-2 hover:bg-gray-700 rounded flex items-center">
                    <UsersIcon className="h-5 w-5 mr-3" />
                    Registro Terapeutas
                  </Link>
                </li>
              </div>

              <div className="mt-4">
                <h3 className="px-4 py-2 text-sm font-semibold text-gray-400 uppercase">Gestión</h3>
                <li>
                  <Link href="/citas" className="px-4 py-2 hover:bg-gray-700 rounded flex items-center">
                    <CalendarDaysIcon className="h-5 w-5 mr-3" />
                    Citas
                  </Link>
                </li>
                <li>
                  <Link href="/agendas" className="px-4 py-2 hover:bg-gray-700 rounded flex items-center">
                    <ClipboardDocumentListIcon className="h-5 w-5 mr-3" />
                    Agendas
                  </Link>
                </li>
                <li>
                  <Link href="/terapeuta" className="px-4 py-2 hover:bg-gray-700 rounded flex items-center">
                    <UsersIcon className="h-5 w-5 mr-3" />
                    Terapeuta
                  </Link>
                </li>
                <li>
                  <Link href="/pacientes" className="px-4 py-2 hover:bg-gray-700 rounded flex items-center">
                    <UsersIcon className="h-5 w-5 mr-3" />
                    Pacientes
                  </Link>
                </li>
              </div>

              <div className="mt-4">
                <h3 className="px-4 py-2 text-sm font-semibold text-gray-400 uppercase">Comunicación</h3>
                <li>
                  <Link href="/mensajes" className="px-4 py-2 hover:bg-gray-700 rounded flex items-center">
                    <ChatBubbleLeftRightIcon className="h-5 w-5 mr-3" />
                    Mensajes
                  </Link>
                </li>
              </div>

              <div className="mt-4">
                <h3 className="px-4 py-2 text-sm font-semibold text-gray-400 uppercase">Reportes y Pagos</h3>
                <li>
                  <Link href="/reporte" className="px-4 py-2 hover:bg-gray-700 rounded flex items-center">
                    <DocumentChartBarIcon className="h-5 w-5 mr-3" />
                    Reportes
                  </Link>
                </li>
                <li>
                  <Link href="/pagos" className="px-4 py-2 hover:bg-gray-700 rounded flex items-center">
                    <CreditCardIcon className="h-5 w-5 mr-3" />
                    Pagos
                  </Link>
                </li>
              </div>

              <div className="mt-4">
                <h3 className="px-4 py-2 text-sm font-semibold text-gray-400 uppercase">Almacén y Documentos</h3>
                <li>
                  <Link href="/almacen" className="px-4 py-2 hover:bg-gray-700 rounded flex items-center">
                    <ArchiveBoxIcon className="h-5 w-5 mr-3" />
                    Almacen
                  </Link>
                </li>
                <li>
                  <Link href="/documentador" className="px-4 py-2 hover:bg-gray-700 rounded flex items-center">
                    <DocumentTextIcon className="h-5 w-5 mr-3" />
                    Documentador
                  </Link>
                </li>
                <li>
                  <Link href="/docs" className="px-4 py-2 hover:bg-gray-700 rounded flex items-center">
                    <DocumentIcon className="h-5 w-5 mr-3" />
                    Documentos
                  </Link>
                </li>
              </div>

              <div className="mt-4">
                <h3 className="px-4 py-2 text-sm font-semibold text-gray-400 uppercase">Administración</h3>
                <li>
                  <Link href="/usuarios" className="px-4 py-2 hover:bg-gray-700 rounded flex items-center">
                    <UserGroupIcon className="h-5 w-5 mr-3" />
                    Usuarios
                  </Link>
                </li>
                <li>
                  <Link href="/ajustes" className="px-4 py-2 hover:bg-gray-700 rounded flex items-center">
                    <Cog6ToothIcon className="h-5 w-5 mr-3" />
                    Ajustes
                  </Link>
                </li>
              </div>
            </>
          )}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;