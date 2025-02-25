"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { HomeIcon, UserPlusIcon, UsersIcon, CalendarDaysIcon, 
  ClipboardDocumentListIcon, ChatBubbleLeftRightIcon, DocumentChartBarIcon, 
  CreditCardIcon, ArchiveBoxIcon, DocumentTextIcon, UserGroupIcon, 
  Cog6ToothIcon, DocumentIcon, Bars2Icon } from "@heroicons/react/24/outline";
import { User } from "lucide-react";
import { useAuth } from "../context/AuthContext.js";

const menuSections = {
  registros: false,
  gestion: false,
  comunicacion: false,
  reportesPagos: false,
  almacenDocumentos: false,
  administracion: false
};

const Sidebar = () => {
  const { isAuthenticated, logout } = useAuth();
  const [openSections, setOpenSections] = useState(menuSections);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleSection = useCallback((section) => {
    setOpenSections(prev => ({ ...menuSections, [section]: !prev[section] }));
  }, []);

  const closeMenu = useCallback(() => setIsMenuOpen(false), []);

  return (
    <div className="sticky top-0 container mx-auto flex justify-between items-center bg-black">
      <div className="flex text-white h-16 items-center">
        <Link
          href="/"
          className="mx-4 my-2 hover:bg-gray-700 rounded flex items-center p-2 transition-colors"
          aria-label="Inicio"
        >
          <HomeIcon className="h-5 w-5 mr-3" />
          CAF TEST
        </Link>
      </div>

      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="text-white lg:hidden p-2 hover:bg-gray-700 rounded"
        aria-label="Menú principal"
        aria-expanded={isMenuOpen}
      >
        <Bars2Icon className="h-5 w-5" />
      </button>

      <nav 
        className={`fixed md:relative md:block w-full md:w-auto top-16 md:top-0 right-0 z-50 bg-black ${
          isMenuOpen ? 'block' : 'hidden'
        }`}
      >
        <ul className="flex flex-col md:flex-row">
          {!isAuthenticated ? (
            <li>
              <Link
                href="/login"
                onClick={closeMenu}
                className="px-4 py-3 hover:bg-gray-700 rounded flex items-center"
              >
                <User className="h-5 w-5 mr-3" />
                Iniciar Sesión
              </Link>
            </li>
          ) : (
            <>
              {Object.keys(menuSections).map((section) => (
                <div key={section} className="mt-2 md:mt-0 md:mx-1">
                  <button
                    onClick={() => toggleSection(section)}
                    className="px-4 py-3 hover:bg-gray-700 rounded flex items-center w-full"
                    aria-expanded={openSections[section]}
                  >
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                      {section.replace(/([A-Z])/g, ' $1').trim()}
                    </h3>
                  </button>
                  
                  {openSections[section] && (
                    <ul className="md:absolute md:bg-black md:rounded-md md:shadow-lg">
                      {getSectionLinks(section, closeMenu)}
                    </ul>
                  )}
                </div>
              ))}
              
              <li className="mt-2 md:hidden">
                <button
                  onClick={logout}
                  className="px-4 py-3 hover:bg-gray-700 rounded flex items-center w-full"
                >
                  <User className="h-5 w-5 mr-3" />
                  Cerrar Sesión
                </button>
              </li>
            </>
          )}
        </ul>
      </nav>
    </div>
  );
};

const getSectionLinks = (section, closeMenu) => {
  const sectionConfig = {
    registros: [
      { href: "/registropacientes", text: "Registro Clientes", icon: UserPlusIcon },
      { href: "/registroterapeuta", text: "Registro Terapeutas", icon: UsersIcon }
    ],
    gestion: [
      { href: "/citas", text: "Citas", icon: CalendarDaysIcon },
      { href: "/agendas", text: "Agendas", icon: ClipboardDocumentListIcon },
      { href: "/terapeuta", text: "Terapeuta", icon: UsersIcon },
      { href: "/pacientes", text: "Pacientes", icon: UsersIcon }
    ],
    comunicacion: [
      { href: "/mensajes", text: "Mensajes", icon: ChatBubbleLeftRightIcon }
    ],
    reportesPagos: [
      { href: "/reporte", text: "Reportes", icon: DocumentChartBarIcon },
      { href: "/pagos", text: "Pagos", icon: CreditCardIcon }
    ],
    almacenDocumentos: [
      { href: "/almacen", text: "Almacen", icon: ArchiveBoxIcon },
      { href: "/documentador", text: "Documentador", icon: DocumentTextIcon },
      { href: "/docs", text: "Documentos", icon: DocumentIcon }
    ],
    administracion: [
      { href: "/usuarios", text: "Usuarios", icon: UserGroupIcon },
      { href: "/ajustes", text: "Ajustes", icon: Cog6ToothIcon }
    ]
  };

  return sectionConfig[section].map(({ href, text, icon: Icon }) => (
    <li key={href}>
      <Link
        href={href}
        onClick={closeMenu}
        className="px-4 py-3 hover:bg-gray-700 rounded flex items-center whitespace-nowrap"
      >
        <Icon className="h-5 w-5 mr-3" />
        {text}
      </Link>
    </li>
  ));
};

export default Sidebar;