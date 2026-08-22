import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { AppRole } from "./authorization";

const cookieName = "Shiva Dental Clinic_session";
const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET ?? "development-only-secret-change-me");
export type SessionUser = { id: string; name: string; email: string; role: AppRole };

export async function createSession(user: SessionUser) {
  const token = await new SignJWT(user).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("12h").sign(secret());
  const store = await cookies();
  store.set(cookieName, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 12 });
}

export async function getSession(): Promise<SessionUser | null> {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return null;
  try { const { payload } = await jwtVerify(token, secret()); return { id: String(payload.id), name: String(payload.name), email: String(payload.email), role: payload.role as AppRole }; }
  catch { return null; }
}

export async function requireUser() { const user = await getSession(); if (!user) redirect("/login"); return user; }
export async function destroySession() { (await cookies()).delete(cookieName); }
