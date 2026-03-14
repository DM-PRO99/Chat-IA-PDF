import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createToken, setAuthCookie } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { UserModel, verifyPassword } from "@/models/User";

const LoginSchema = z.object({
  username: z.string().min(3).max(100).transform(v => v.toLowerCase().trim()),
  password: z.string().min(6).max(200),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const json: unknown = await req.json().catch(() => null);
    const parsed = LoginSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Credenciales inválidas." }, { status: 400 });
    }

    const { username, password } = parsed.data;

    await connectDB();

    // Buscar usuario en la BD
    const user = await UserModel.findOne({ username });

    if (!user) {
      return NextResponse.json({ error: "Usuario o contraseña incorrectos." }, { status: 401 });
    }

    // Verificar contraseña
    if (!verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: "Usuario o contraseña incorrectos." }, { status: 401 });
    }

    // Crear token JWT
    const token = await createToken({ id: user._id.toString(), username: user.username });
    const res = NextResponse.json({ success: true });
    setAuthCookie(res, token);
    return res;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}

