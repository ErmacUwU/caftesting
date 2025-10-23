"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { HomeIcon, UserPlusIcon, UsersIcon, CalendarDaysIcon, 
  ClipboardDocumentListIcon, ChatBubbleLeftRightIcon, DocumentChartBarIcon,
  CreditCardIcon, ArchiveBoxIcon, DocumentTextIcon, UserGroupIcon, 
  Cog6ToothIcon, DocumentIcon, Bars2Icon } from "@heroicons/react/24/outline";
import { User } from "lucide-react";
import { useAuth } from "../context/AuthContext.js";
import { usePathname } from "next/navigation";


const menuSections = {
  registros: false,
  gestion: false,
  comunicacion: false,
  reportesPagos: false,
  almacenDocumentos: false,
  administracion: false,
};

const Sidebar = () => {
  const pathname = usePathname();
  const { isAuthenticated, logout } = useAuth();
  const [openSections, setOpenSections] = useState(menuSections);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false); // Para detectar el tamaño de la pantalla


  // Detectar el tamaño de la pantalla
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024); // Cambia según tu breakpoint
    };

    handleResize(); // Establecer el tamaño inicial
    window.addEventListener("resize", handleResize); // Escuchar cambios de tamaño

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);


  // Cerrar menú al hacer clic fuera
  const handleClickOutside = useCallback((event) => {
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      setIsMenuOpen(false); // Cierra el menú si el clic es fuera del contenedor del menú
      setOpenSections(menuSections); // Cierra las secciones abiertas en pantalla grande
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside); // Escucha el evento de clic
    return () => {
      document.removeEventListener("mousedown", handleClickOutside); // Limpia el evento al desmontar el componente
    };
  }, [handleClickOutside]);

  const toggleSection = useCallback((section) => {
    setOpenSections(prev => ({ ...menuSections, [section]: !prev[section] }));
  }, []);

 const closeMenu = useCallback(() => {
    setIsMenuOpen(false); // Cierra el menú móvil
    setOpenSections(menuSections); // Cierra todos los submenús
}, []);

  if(pathname ==="/login")return null;


  return (
    <div className="sidebar sticky top-0 flex justify-between items-center w-full" ref={menuRef}>
      <div className="flex h-16 text-white  items-center">
        <Link
          href="/"
          className="mx-4 my-2 hover:bg-gray-700 rounded flex items-center p-2 transition-colors"
          aria-label="Inicio"
        >
          <HomeIcon className="h-5 w-5 mr-3" />
          CAF TEST
        </Link>
      </div>

      {/* Solo muestra el botón en pantallas pequeñas */}
      {isMobile && (
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="text-white lg:hidden p-2 hover:bg-gray-700 rounded"
          aria-label="Menú principal"
          aria-expanded={isMenuOpen}
        >
          <Bars2Icon className="h-5 w-5" />
        </button>
      )}

      <nav 
        className={`fixed md:relative w-full md:w-auto top-16 md:top-0 right-0 z-20 bg-[#141422] ${
          isMenuOpen || !isMobile ? 'block' : 'hidden'
        } md:block`}>
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
                    <h3 className=" font-medium text-xs text-white uppercase tracking-wide">
                      {section.replace(/([A-Z])/g, ' $1').trim()}
                    </h3>
                  </button>
                  
                  {openSections[section] && (
                    <ul className="md:absolute md:bg-[#1a1a2e] md:rounded-md md:shadow-lg">
                      {getSectionLinks(section, closeMenu, openSections[section])}
                    </ul>
                  )}
                </div>
              ))}
            </>
          )}
        </ul>
      </nav>
    </div>
  );
};

const getSectionLinks = (section, closeMenu, isOpen) => {
  const sectionConfig = {
    registros: [
      { href: "/registropacientes", text: "Registro Clientes", icon: UserPlusIcon },
      { href: "/registroterapeuta", text: "Registro Terapeutas", icon: UsersIcon }
    ],
    gestion: [
      { href: "/citas", text: "Citas", icon: CalendarDaysIcon },
      { href: "/agendas", text: "Agendas", icon: ClipboardDocumentListIcon },
      { href: "/terapeuta", text: "Terapeuta", icon: UsersIcon },
      { href: "/pacientes", text: "Pacientes", icon: UsersIcon },
      { href: "/servicios", text: "Servicios", icon: ClipboardDocumentListIcon }
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
      { href: "/ajustes", text: "Ajustes", icon: Cog6ToothIcon },
      {href:"/login",text:"Cerrar Sesion", icon: UserPlusIcon
      }

    ],
    
  };

  return sectionConfig[section].map(({ href, text, icon: Icon }) => (
    <li key={href}>
      <Link
        href={href}
        onClick={() => {
          closeMenu();  // Esto cerrará el menú al hacer clic en un enlace
        }}
        className={`px-4 py-3 hover:bg-gray-700 rounded flex items-center whitespace-nowrap ${isOpen ? 'text-gray-200 text-xs' : 'text-gray-200 text-xs'}`}
      >
        <Icon className="h-5 w-5 mr-3" />
        {text}
      </Link>
    </li>
  ));
};

export default Sidebar;
