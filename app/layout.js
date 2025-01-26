import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/app/sidebar/sidebar"; // Asegúrate de que la ruta sea correcta
import { AuthProvider } from "./context/AuthContext.js";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Sistema CAF",
  description: "Generando un sistema para el CAF",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} flex`}>
        <AuthProvider><Sidebar />
        <div className="flex-1 p-6 bg-black-100 overflow-auto">
        {children}
        </div></AuthProvider>
      </body>
    </html>
  );
}