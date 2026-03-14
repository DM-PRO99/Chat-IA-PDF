import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createToken, setAuthCookie, validateCredentials } from "@/lib/auth";

const LoginSchema = z.object({
  username: z.string().min(1).max(100),
  password: z.string().min(1).max(200),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  const json: unknown = await req.json().catch(() => null);
  const parsed = LoginSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Credenciales inválidas." }, { status: 400 });
  }

  const { username, password } = parsed.data;
  if (!validateCredentials(username, password)) {
    return NextResponse.json({ error: "Usuario o contraseña incorrectos." }, { status: 401 });
  }

  const token = await createToken({ id: "local-admin", username });
  const res = NextResponse.json({ success: true });
  setAuthCookie(res, token);
  return res;
}

