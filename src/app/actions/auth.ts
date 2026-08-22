"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, destroySession } from "@/lib/session";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const user = await db.user.findUnique({ where: { email } });
  if (!user?.active || !(await bcrypt.compare(password, user.passwordHash))) redirect("/login?error=invalid");
  await createSession({ id: user.id, name: user.name, email: user.email, role: user.role });
  redirect("/");
}
export async function logoutAction() { await destroySession(); redirect("/login"); }
