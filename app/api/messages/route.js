import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Message from "@/models/Message";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const receptor = searchParams.get("receptor");

  if (!userId || !receptor) {
    return NextResponse.json({ error: "userId y receptor son requeridos" }, { status: 400 });
  }

  await dbConnect();

  try {
    const messages = await Message.find({
      $or: [
        { from: userId, to: receptor },
        { from: receptor, to: userId },
      ],
    }).sort({ timestamp: 1 });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al obtener mensajes" }, { status: 500 });
  }
}
