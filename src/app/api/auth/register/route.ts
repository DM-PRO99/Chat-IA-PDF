import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createToken, setAuthCookie } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { UserModel, hashPassword } from "@/models/User";

const RegisterSchema = z.object({
  username: z.string().min(3).max(100).transform(v => v.toLowerCase().trim()),
  password: z.string().min(6).max(200),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const json: unknown = await req.json().catch(() => null);
    const parsed = RegisterSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "El usuario debe tener al menos 3 caracteres y la contraseña 6." },
        { status: 400 }
      );
    }

    const { username, password } = parsed.data;

    await connectDB();

    // Verificar si el usuario ya existe
    const existingUser = await UserModel.findOne({ username });
    if (existingUser) {
      return NextResponse.json(
        { error: "El usuario ya existe." },
        { status: 409 }
      );
    }

    // Crear nuevo usuario
    const passwordHash = hashPassword(password);
    const user = await UserModel.create({
      username,
      passwordHash,
    });

    // Crear token JWT
    const token = await createToken({ id: user._id.toString(), username: user.username });
    const res = NextResponse.json({ success: true, message: "Usuario registrado exitosamente." });
    setAuthCookie(res, token);
    return res;
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Error al registrar el usuario." },
      { status: 500 }
    );
  }
}
