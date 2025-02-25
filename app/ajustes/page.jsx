"use client";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.js";
import { useRouter } from "next/navigation";

const Ajustes = () => {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const { isAuthenticated } = useAuth();
    const router = useRouter();

    // Redirige al login si no está autenticado
    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/login");
        }
    }, [isAuthenticated, router]);

    // Evita que se muestre contenido mientras redirige
    if (!isAuthenticated) {
        return null;
    }

    // Solo ejecuta el código si está en el cliente
    useEffect(() => {
        if (typeof window !== "undefined") { // ✅ Previene errores en SSR
            const storedTheme = localStorage.getItem("theme") === "dark";
            setIsDarkMode(storedTheme);
            if (storedTheme) {
                document.documentElement.classList.add("dark");
            }
        }
    }, []);

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
