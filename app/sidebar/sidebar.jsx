"use client";

import { useState, useCallback, useEffect, useRef } from "react";
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
  Bars2Icon,
} from "@heroicons/react/24/outline";
import { User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { usePathname } from "next/navigation";

const menuSections = {
  gestion: false,
  comunicacion: false,
  reportesPagos: false,
  almacenDocumentos: false,
  administracion: false,
};

const Sidebar = () => {
  const pathname = usePathname();
  const { isAuthenticated, logout, userRole } = useAuth();
  const [openSections, setOpenSections] = useState(menuSections);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleClickOutside = useCallback((event) => {
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      setIsMenuOpen(false);
      setOpenSections(menuSections);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  const toggleSection = useCallback((section) => {
    setOpenSections((prev) => ({
      ...menuSections,
      [section]: !prev[section],
    }));
  }, []);

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
    setOpenSections(menuSections);
  }, []);

  if (pathname === "/login") return null;

  return (
    <div className="sidebar sticky top-0 flex justify-between items-center w-full" ref={menuRef}>
      <div className="flex h-16 text-white items-center">
        <Link
          href="/"
          className="mx-4 my-2 hover:bg-gray-700 rounded flex items-center p-2 transition-colors"
        >
          <HomeIcon className="h-5 w-5 mr-3" />
          CAF TEST
        </Link>
      </div>

      {isMobile && (
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="text-white lg:hidden p-2 hover:bg-gray-700 rounded"
        >
          <Bars2Icon className="h-5 w-5" />
        </button>
      )}

      <nav
        className={`fixed md:relative w-full md:w-auto top-16 md:top-0 right-0 z-20 bg-[#141422] ${
          isMenuOpen || !isMobile ? "block" : "hidden"
        } md:block`}
      >
        <ul className="flex flex-col md:flex-row">
          {!isAuthenticated ? (
            <li>
              <Link href="/login" onClick={closeMenu} className="px-4 py-3 hover:bg-gray-700 flex items-center">
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
                  >
                    <h3 className="text-xs text-white uppercase tracking-wide">
                      {section.replace(/([A-Z])/g, " $1")}
                    </h3>
                  </button>

                  {openSections[section] && (
                    <ul className="md:absolute md:bg-[#1a1a2e] md:rounded-md md:shadow-lg">
                      {getSectionLinks(section, closeMenu, openSections[section], userRole, logout)}
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

const getSectionLinks = (section, closeMenu, isOpen, userRole, logout) => {
  const sectionConfig = {
    gestion: [
      { href: "/citas", text: "Citas", icon: CalendarDaysIcon },
      { href: "/agendas", text: "Agendas", icon: ClipboardDocumentListIcon },
      { href: "/servicios", text: "Servicios", icon: ClipboardDocumentListIcon },
    ],
    comunicacion: [{ href: "/mensajes", text: "Mensajes", icon: ChatBubbleLeftRightIcon }],
    reportesPagos: [
      { href: "/reporte", text: "Reportes", icon: DocumentChartBarIcon },
      { href: "/pagos", text: "Pagos", icon: CreditCardIcon },
    ],
    almacenDocumentos: [
      { href: "/almacen", text: "Almacen", icon: ArchiveBoxIcon },
      { href: "/documentador", text: "Documentador", icon: DocumentTextIcon },
      { href: "/docs", text: "Documentos", icon: DocumentIcon },
    ],
    administracion: [
      { href: "/registroU", text: "Usuarios", icon: UserGroupIcon },
      { href: "/ajustes", text: "Ajustes", icon: Cog6ToothIcon },
      { href: "/login", text: "Cerrar Sesión", icon: UserPlusIcon, logout: true },
    ],
  };

  // 🔐 FILTRO POR ROL
  const filteredLinks = sectionConfig[section].filter((link) => {
    if (link.href === "/usuarios" && userRole === "operador") {
      return false;
    }
    return true;
  });

  return filteredLinks.map(({ href, text, icon: Icon, logout: isLogout }) => (
    <li key={href}>
      <Link
        href={href}
        onClick={() => {
          if (isLogout) logout();
          closeMenu();
        }}
        className="px-4 py-3 hover:bg-gray-700 flex items-center text-gray-200 text-xs"
      >
        <Icon className="h-5 w-5 mr-3" />
        {text}
      </Link>
    </li>
  ));
};

export default Sidebar;
