import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

const USER_ROLES = ["patient", "therapist", "admin"];

function toView(user) {
  return {
    _id: user._id,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    profile: user.profile || {},
    fullName: `${user.profile?.firstName || ""} ${user.profile?.lastName || ""}`.trim(),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function GET(_request, { params }) {
  await dbConnect();
  const user = await User.findById(params.id).lean();
  if (!user) return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 });
  return NextResponse.json({ user: toView(user) });
}

export async function PATCH(request, { params }) {
  await dbConnect();
  const body = await request.json();
  const updates = {};

  if (body.email) updates.email = String(body.email).trim().toLowerCase();
  if (body.role) {
    if (!USER_ROLES.includes(body.role)) {
      return NextResponse.json({ message: "role inválido" }, { status: 400 });
    }
    updates.role = body.role;
  }
  if (typeof body.isActive === "boolean") updates.isActive = body.isActive;
  if (body.profile && typeof body.profile === "object") updates.profile = body.profile;
  if (body.password && String(body.password).trim()) {
    updates.passwordHash = await bcrypt.hash(body.password, 10);
  }

  const user = await User.findByIdAndUpdate(params.id, updates, { new: true });
  if (!user) return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 });
  return NextResponse.json({ user: toView(user) });
}

export async function DELETE(_request, { params }) {
  await dbConnect();
  const user = await User.findByIdAndDelete(params.id);
  if (!user) return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 });
  return NextResponse.json({ message: "Usuario eliminado correctamente" });
}
