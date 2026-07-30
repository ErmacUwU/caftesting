"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  HomeIcon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  DocumentChartBarIcon,
  CreditCardIcon,
  DocumentTextIcon,
  UserGroupIcon,
  Bars2Icon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { usePathname } from "next/navigation";

// 🔹 Lista limpia de los 7 enlaces desplegados directamente
const navLinks = [
  { href: "/citas", text: "Citas", icon: CalendarDaysIcon },
  { href: "/agendas", text: "Agendas", icon: ClipboardDocumentListIcon },
  { href: "/servicios", text: "Servicios", icon: ClipboardDocumentListIcon },
  { href: "/reporte", text: "Reportes", icon: DocumentChartBarIcon },
  { href: "/pagos", text: "Pagos", icon: CreditCardIcon },
  { href: "/documentador", text: "Expediente", icon: DocumentTextIcon },
  { href: "/registroU", text: "Usuarios", icon: UserGroupIcon, allowedRoles: ["admin"] },
];

const Sidebar = () => {
  const pathname = usePathname();
  const { isAuthenticated, logout, userRole } = useAuth();
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (pathname === "/login") return null;

  // Filtrar enlaces según el rol del usuario
  const visibleLinks = navLinks.filter((link) => {
    if (link.allowedRoles && !link.allowedRoles.includes(userRole)) {
      return false;
    }
    return true;
  });

  return (
    <div className="sidebar sticky top-0 flex justify-between items-center w-full bg-[#141422] z-30" ref={menuRef}>
      {/* Logo / Inicio */}
      <div className="flex h-16 text-white items-center">
        <Link
          href="/"
          className="mx-4 my-2 hover:bg-gray-700 rounded-md flex items-center p-2 transition-colors"
        >
          <HomeIcon className="h-5 w-5 mr-2 text-indigo-400" />
          <span className="font-bold text-sm tracking-wide">CAF TEST</span>
        </Link>
      </div>

      {/* Botón hamburguesa para Móvil */}
      {isMobile && (
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="text-white lg:hidden p-2 mr-4 hover:bg-gray-700 rounded-md"
        >
          <Bars2Icon className="h-6 w-6" />
        </button>
      )}

      {/* Navegación principal */}
      <nav
        className={`fixed lg:relative w-full lg:w-auto top-16 lg:top-0 right-0 z-20 bg-[#141422] ${
          isMenuOpen || !isMobile ? "block" : "hidden"
        } lg:block`}
      >
        <ul className="flex flex-col lg:flex-row items-stretch lg:items-center p-2 lg:p-0">
          {!isAuthenticated ? (
            <li>
              <Link
                href="/login"
                onClick={() => setIsMenuOpen(false)}
                className="px-4 py-2 hover:bg-gray-700 rounded-md flex items-center text-sm text-gray-200"
              >
                <User className="h-5 w-5 mr-2" />
                Iniciar Sesión
              </Link>
            </li>
          ) : (
            <>
              {visibleLinks.map(({ href, text, icon: Icon }) => {
                const isActive = pathname === href;
                return (
                  <li key={href} className="my-1 lg:my-0 lg:mx-1">
                    <Link
                      href={href}
                      onClick={() => setIsMenuOpen(false)}
                      className={`px-3 py-2 rounded-md flex items-center text-xs font-medium transition-colors whitespace-nowrap ${
                        isActive
                          ? "bg-indigo-600 text-white"
                          : "text-gray-300 hover:bg-gray-700 hover:text-white"
                      }`}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {text}
                    </Link>
                  </li>
                );
              })}

              <li className="mt-2 lg:mt-0 lg:ml-2">
                <button
                  onClick={() => {
                    logout();
                    setIsMenuOpen(false);
                  }}
                  className="px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-md flex items-center w-full lg:w-auto text-xs font-medium transition-colors"
                >
                  <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
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

export default Sidebar;