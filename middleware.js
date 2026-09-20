import { NextResponse } from "next/server";

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // 1. Intentar obtener el rol y el token desde las cookies del navegador
  const userRole = request.cookies.get("userRole")?.value;
  const token = request.cookies.get("token")?.value;

  // 2. Definir las rutas que están estrictamente protegidas para Administradores
  // Añade aquí todas las rutas a las que los operadores/pacientes no deban entrar
  const adminRoutes = ["/registroU", "/admin"];

  // 3. Evaluar si el usuario intenta acceder a una ruta de administrador
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));

  if (isAdminRoute) {
    // Comparación insensible a mayúsculas/minúsculas: un rol guardado como
    // "Admin" (en vez de "admin") no debe rebotar al usuario a /login.
    const normalizedRole = (userRole || "").toLowerCase();

    // Si no hay token (no está logueado) o el rol no es admin, lo rebotamos
    if (!token || normalizedRole !== "admin") {
      // Redirige al login o a una página de "no autorizado"
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Si pasa las reglas o es una ruta pública, dejamos continuar la petición con normalidad
  return NextResponse.next();
}

// 4. Configurar el Matcher (Optimización)
// Esto le dice a Next.js que ejecute el middleware SOLO en tus páginas, 
// ignorando archivos estáticos, imágenes o APIs internas.
export const config = {
  matcher: [
    /*
     * Coincide con todas las rutas de páginas excepto:
     * - api (rutas de API)
     * - _next/static (archivos estáticos)
     * - _next/image (optimización de imágenes)
     * - favicon.ico (icono del sitio)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};