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

export async function GET(request) {
  await dbConnect();
  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role");
  const query = role && USER_ROLES.includes(role) ? { role } : {};
  const users = await User.find(query).sort({ "profile.firstName": 1, "profile.lastName": 1 }).lean();
  return NextResponse.json({ users: users.map(toView) });
}

export async function POST(request) {
  await dbConnect();
  const body = await request.json();
  const { email, password, role, profile = {} } = body;

  if (!email || !password || !role) {
    return NextResponse.json({ message: "email, password y role son obligatorios" }, { status: 400 });
  }
  if (!USER_ROLES.includes(role)) {
    return NextResponse.json({ message: "role inválido" }, { status: 400 });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const exists = await User.findOne({ email: normalizedEmail });
  if (exists) {
    return NextResponse.json({ message: "Este correo ya está registrado" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    email: normalizedEmail,
    passwordHash,
    role,
    profile,
    isActive: true,
  });

  return NextResponse.json({ user: toView(user) }, { status: 201 });
}
