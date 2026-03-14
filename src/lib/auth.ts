import { SignJWT, jwtVerify } from "jose";
import { cookies as nextCookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

import type { AuthUser } from "@/types";

const COOKIE_NAME = "pdf-agent-auth";
const TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function getJwtSecret(): Uint8Array {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("NEXTAUTH_SECRET must be set and at least 32 characters.");
  }
  return new TextEncoder().encode(secret);
}

export async function createToken(user: AuthUser): Promise<string> {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const secret = getJwtSecret();

  return new SignJWT({ username: user.username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(nowSeconds)
    .setExpirationTime(nowSeconds + TOKEN_MAX_AGE_SECONDS)
    .setSubject(user.id)
    .setJti(uuidv4())
    .sign(secret);
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });

    const sub = typeof payload.sub === "string" ? payload.sub : null;
    const username = typeof payload.username === "string" ? payload.username : null;
    if (!sub || !username) return null;

    return { id: sub, username };
  } catch {
    return null;
  }
}

export async function getAuthUser(req: NextRequest): Promise<AuthUser | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function setAuthCookie(res: NextResponse, token: string): void {
  res.cookies.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TOKEN_MAX_AGE_SECONDS,
  });
}

export function clearAuthCookie(res: NextResponse): void {
  res.cookies.set({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export function validateCredentials(username: string, password: string): boolean {
  const envUser = process.env.APP_USERNAME ?? "";
  const envPass = process.env.APP_PASSWORD ?? "";
  return username === envUser && password === envPass;
}

export async function getServerAuthUser(): Promise<AuthUser | null> {
  const cookieStore = await nextCookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

