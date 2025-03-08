"use client";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.js";
import { useRouter } from "next/navigation";

const Ajustes = () => {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const { isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // Manejo de autenticación
        if (!isLoading && !isAuthenticated) {
            router.replace('/login'); // ⬅ Redirige solo si no está autenticado
            }
          

        // Verificar y aplicar el modo guardado en localStorage
        if (typeof window !== "undefined") { // ✅ Evita errores en SSR
            const storedTheme = localStorage.getItem("theme") === "dark";
            setIsDarkMode(storedTheme);
            if (storedTheme) {
                document.documentElement.classList.add("dark");
            }
        }
    }, [isAuthenticated, isLoading, router]);// Se ejecuta cuando cambia la autenticación o el router

    if (isLoading) {
        return <p>Cargando...</p>; // ⬅ Muestra un loader en lugar de redirigir inmediatamente
      }
    
      if (!isAuthenticated) {
        return null; // ⬅ Evita mostrar contenido mientras se redirige
    }

    const toggleTheme = () => {
        const newTheme = !isDarkMode;
        setIsDarkMode(newTheme);
        if (newTheme) {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
        localStorage.setItem("theme", newTheme ? "dark" : "light");
    };

    return (
        <div className="p-4">
            <h1 className="text-lg">Ajustes</h1>
            <button
                onClick={toggleTheme}
                className="mt-4 p-2 bg-blue-500 text-white rounded"
            >
                Cambiar a modo {isDarkMode ? "claro" : "oscuro"}
            </button>
        </div>
    );
};

export default Ajustes;


