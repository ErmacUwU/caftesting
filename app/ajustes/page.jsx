"use client"
import { useEffect, useState } from 'react';

const Ajustes = () => {
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        // Verifica y aplica el modo guardado en localStorage
        const storedTheme = localStorage.getItem('theme') === 'dark';
        setIsDarkMode(storedTheme);
        if (storedTheme) {
            document.documentElement.classList.add('dark');
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = !isDarkMode;
        setIsDarkMode(newTheme);
        // Aplica o quita la clase `dark` en el HTML
        if (newTheme) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        // Guarda la preferencia en localStorage
        localStorage.setItem('theme', newTheme ? 'dark' : 'light');
    };

    return (
        <div className="p-4">
            <h1 className="text-lg">Ajustes</h1>
            <button
                onClick={toggleTheme}
                className="mt-4 p-2 bg-blue-500 text-white rounded"
            >
                Cambiar a modo {isDarkMode ? 'claro' : 'oscuro'}
            </button>
        </div>
    );
};

export default Ajustes;