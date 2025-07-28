import { NextResponse } from "next/server";

// Usuario administrador predefinido
const ADMIN_CREDENTIALS = {
  email: "admin@caf.com", // Correo del administrador
  password: "Admin1234", // Contraseña del administrador
  name: "Administrador"
};

// Maneja la solicitud HTTP POST para el inicio de sesión.
export async function POST(req) {
  // Extrae los datos enviados en la solicitud (email y password).
  const { email, password } = await req.json();

  try {
    // Verifica si las credenciales coinciden con las del administrador.
    if (email !== ADMIN_CREDENTIALS.email || password !== ADMIN_CREDENTIALS.password) {
      return NextResponse.json(
        { msg: "Credenciales incorrectas", success: false },
        { status: 401 } // Unauthorized
      );
    }

    // Si las credenciales son correctas, permite el acceso y retorna un mensaje de éxito.
    return NextResponse.json({
      msg: "Inicio de sesión exitoso",
      success: true,
      userId: "admin", // Se asigna un ID fijo para el administrador
      userName: ADMIN_CREDENTIALS.name,
    });
  } catch (error) {
    console.error(error);
    // Devuelve un mensaje genérico de error del servidor.
    return NextResponse.json(
      { msg: "Error en el servidor", success: false },
      { status: 500 }
    );
  }
}
