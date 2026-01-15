import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/app/sidebar/sidebar"; // Asegúrate de que la ruta sea correcta
import { AuthProvider } from "./context/AuthContext.js"; // Importa el proveedor de contexto de autenticación.
import TawkClient from "./components/TawkClient";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Sistema CAF",
  description: "Generando un sistema para el CAF",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} flex flex-col
      bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] `}>
        {/* Proveedor de contexto de autenticación que envuelve la aplicación para manejar el estado de autenticación. */}
        <AuthProvider><Sidebar/>
        <div className="overflow-auto">
        {children}
          <Script
            id="tawk-script"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
                (function(){
                  var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
                  s1.async=true;
                  s1.src='https://embed.tawk.to/66760bbdeaf3bd8d4d132cca/1i0uhrnl0';
                  s1.charset='UTF-8';
                  s1.setAttribute('crossorigin','*');
                  s0.parentNode.insertBefore(s1,s0);
                })();
              `,
            }}
          />
        </div></AuthProvider>
      </body>
    </html>
  );
}