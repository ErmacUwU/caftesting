import { NextResponse } from "next/server";

// Borra las cookies de sesión que lee el middleware. La cookie "token" es
// httpOnly, así que el cliente no puede borrarla por su cuenta.
export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set("userRole", "", { path: "/", maxAge: 0 });
  response.cookies.set("token", "", { path: "/", maxAge: 0, httpOnly: true });
  return response;
}
