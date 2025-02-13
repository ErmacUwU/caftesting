"use client";

import { useState } from "react";
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

  const [openRegistros, setOpenRegistros] = useState(false);
  const [openGestion, setOpenGestion] = useState(false);
  const [openComunicacion, setOpenComunicacion] = useState(false);
  const [openReportesPagos, setOpenReportesPagos] = useState(false);
  const [openAlmacenDocumentos, setOpenAlmacenDocumentos] = useState(false);
  const [openAdministracion, setOpenAdministracion] = useState(false);

  return (
    <div className="sticky top-0 left-0 container mx-auto flex bg-black justify-between items-center">
      <div className="flex flex-row text-white h-16 items-center px-4">
        <div className="text-2xl font-semibold">CAF TESTS</div>
      </div>
      <nav className="flex">
        <ul className="flex flex-row">
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
                <button onClick={() => setOpenRegistros(!openRegistros)} className="px-4 py-2 hover:bg-gray-700 rounded flex items-center w-full text-left">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase">Registros</h3>
                </button>
                {openRegistros && (
                  <>
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
                  </>
                )}
              </div>

              <div className="mt-4">
                <button onClick={() => setOpenGestion(!openGestion)} className="px-4 py-2 hover:bg-gray-700 rounded flex items-center w-full text-left">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase">Gestión</h3>
                </button>
                {openGestion && (
                  <>
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
                  </>
                )}
              </div>

              <div className="mt-4">
                <button onClick={() => setOpenComunicacion(!openComunicacion)} className="px-4 py-2 hover:bg-gray-700 rounded flex items-center w-full text-left">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase">Comunicación</h3>
                </button>
                {openComunicacion && (
                  <>
                    <li>
                      <Link href="/mensajes" className="px-4 py-2 hover:bg-gray-700 rounded flex items-center">
                        <ChatBubbleLeftRightIcon className="h-5 w-5 mr-3" />
                        Mensajes
                      </Link>
                    </li>
                  </>
                )}
              </div>

              <div className="mt-4">
                <button onClick={() => setOpenReportesPagos(!openReportesPagos)} className="px-4 py-2 hover:bg-gray-700 rounded flex items-center w-full text-left">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase">Reportes y Pagos</h3>
                </button>
                {openReportesPagos && (
                  <>
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
                  </>
                )}
              </div>

              <div className="mt-4">
                <button onClick={() => setOpenAlmacenDocumentos(!openAlmacenDocumentos)} className="px-4 py-2 hover:bg-gray-700 rounded flex items-center w-full text-left">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase">Almacén y Documentos</h3>
                </button>
                {openAlmacenDocumentos && (
                  <>
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
                  </>
                )}
              </div>

              <div className="mt-4">
                <button onClick={() => setOpenAdministracion(!openAdministracion)} className="px-4 py-2 hover:bg-gray-700 rounded flex items-center w-full text-left">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase">Administración</h3>
                </button>
                {openAdministracion && (
                  <>
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
                  </>
                )}
              </div>
            </>
          )}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;