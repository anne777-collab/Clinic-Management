"use server";

import { AppointmentStatus, QueueStatus, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { can } from "@/lib/authorization";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { appointmentOverlaps, appointmentSchema, patientSchema, visitSchema } from "@/lib/validators";

async function audit(actorId: string, action: string, entity: string, entityId: string, detail?: object) { await db.auditEvent.create({ data: { actorId, action, entity, entityId, detail } }); }
function assert(role: Role, permission: string) { if (!can(role, permission)) throw new Error("You do not have permission for this action."); }

export async function createPatientAction(formData: FormData) {
  const user = await requireUser(); assert(user.role, "patients:write");
  const value = patientSchema.parse(Object.fromEntries(formData));
  const count = await db.patient.count();
  const patient = await db.patient.create({ data: { ...value, email: value.email || null, patientNumber: `CL-${String(count + 1).padStart(5, "0")}` } });
  await audit(user.id, "CREATE", "Patient", patient.id, { mobile: patient.mobile });
  redirect(`/patients/${patient.id}`);
}
export async function findDuplicatePatientsAction(mobile: string) {
  const user = await requireUser(); assert(user.role, "patients:write");
  const normalized = mobile.trim();
  if (normalized.length < 8) return [];
  return db.patient.findMany({ where: { mobile: normalized }, select: { id: true, firstName: true, lastName: true, patientNumber: true, dateOfBirth: true }, take: 5 });
}
export async function updatePatientAction(formData: FormData) {
  const user = await requireUser(); assert(user.role, "patients:write");
  const id = String(formData.get("id") ?? ""); const value = patientSchema.parse(Object.fromEntries(formData));
  const patient = await db.patient.update({ where: { id }, data: { ...value, email: value.email || null } });
  await audit(user.id, "UPDATE", "Patient", patient.id, { mobile: patient.mobile });
  revalidatePath(`/patients/${patient.id}`); revalidatePath("/patients"); redirect(`/patients/${patient.id}?updated=1`);
}
export async function createAppointmentAction(formData: FormData) {
  const user = await requireUser(); assert(user.role, "appointments:write");
  const parsed = appointmentSchema.parse(Object.fromEntries(formData));
  const startsAt = parsed.startsAt; const endsAt = new Date(startsAt.getTime() + parsed.durationMinutes * 60000);
  const nearby = await db.appointment.findMany({ where: { status: { notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW] }, startsAt: { lt: endsAt }, endsAt: { gt: startsAt } }, select: { startsAt: true, endsAt: true } });
  if (appointmentOverlaps(nearby, startsAt, parsed.durationMinutes)) redirect("/appointments?error=conflict");
  const appointment = await db.appointment.create({ data: { patientId: parsed.patientId, startsAt, endsAt, reason: parsed.reason || null } });
  await audit(user.id, "CREATE", "Appointment", appointment.id);
  revalidatePath("/appointments"); redirect("/appointments?success=created");
}
export async function checkInAction(formData: FormData) {
  const user = await requireUser(); assert(user.role, "queue:manage");
  const appointmentId = String(formData.get("appointmentId")); const appointment = await db.appointment.findUniqueOrThrow({ where: { id: appointmentId } });
  const date = new Date(appointment.startsAt); date.setHours(0, 0, 0, 0);
  const last = await db.queueEntry.aggregate({ where: { date }, _max: { token: true } });
  await db.$transaction([db.appointment.update({ where: { id: appointmentId }, data: { status: AppointmentStatus.CHECKED_IN } }), db.queueEntry.upsert({ where: { appointmentId }, update: { status: QueueStatus.WAITING }, create: { appointmentId, patientId: appointment.patientId, date, token: (last._max.token ?? 0) + 1 } })]);
  await audit(user.id, "CHECK_IN", "Appointment", appointmentId); revalidatePath("/"); revalidatePath("/queue");
}
export async function updateQueueAction(formData: FormData) {
  const user = await requireUser(); assert(user.role, "queue:manage");
  const id = String(formData.get("id")); const status = String(formData.get("status")) as QueueStatus;
  await db.queueEntry.update({ where: { id }, data: { status } }); await audit(user.id, "QUEUE_STATUS", "QueueEntry", id, { status }); revalidatePath("/"); revalidatePath("/queue");
}
export async function createVisitAction(formData: FormData) {
  const user = await requireUser(); assert(user.role, "visits:write");
  const value = visitSchema.parse(Object.fromEntries(formData));
  const visit = await db.visit.create({ data: { ...value, doctorId: user.id, followUpAt: value.followUpAt || null, prescription: { create: {} } } });
  const names = formData.getAll("medicineName").map(String); const dosages = formData.getAll("dosage").map(String); const frequencies = formData.getAll("frequency").map(String); const durations = formData.getAll("duration").map(String);
  const prescription = await db.prescription.findUniqueOrThrow({ where: { visitId: visit.id } });
  if (names.length) await db.prescriptionMedicine.createMany({ data: names.filter(Boolean).map((name, index) => ({ prescriptionId: prescription.id, name, dosage: dosages[index] || "As directed", frequency: frequencies[index] || "", duration: durations[index] || "", isFreeText: true })) });
  await audit(user.id, "CREATE", "Visit", visit.id); redirect(`/prescriptions/${visit.id}`);
}
export async function createMedicineAction(formData: FormData) {
  const user = await requireUser(); assert(user.role, "medicines:manage"); const name = String(formData.get("name") ?? "").trim(); if (!name) return;
  const medicine = await db.medicine.upsert({ where: { name }, update: { strength: String(formData.get("strength") || "") || null, defaultInstructions: String(formData.get("instructions") || "") || null, active: true }, create: { name, strength: String(formData.get("strength") || "") || null, defaultInstructions: String(formData.get("instructions") || "") || null } });
  await audit(user.id, "UPSERT", "Medicine", medicine.id); revalidatePath("/medicines");
}
export async function createStaffAction(formData: FormData) {
  const user = await requireUser(); assert(user.role, "users:manage");
  const name = String(formData.get("name") ?? "").trim(); const email = String(formData.get("email") ?? "").trim().toLowerCase(); const password = String(formData.get("password") ?? ""); const role = String(formData.get("role") ?? "") as Role;
  if (!name || !/^\S+@\S+\.\S+$/.test(email) || password.length < 12 || !Object.values(Role).includes(role)) throw new Error("Provide a name, valid email, 12-character password, and role.");
  const staff = await db.user.create({ data: { name, email, passwordHash: await bcrypt.hash(password, 12), role } });
  await audit(user.id, "CREATE", "User", staff.id, { role }); revalidatePath("/staff");
}
export async function updateStaffAction(formData: FormData) {
  const user = await requireUser(); assert(user.role, "users:manage");
  const id = String(formData.get("id") ?? ""); const action = String(formData.get("action") ?? "");
  const staff = await db.user.findUniqueOrThrow({ where: { id } });
  if (staff.id === user.id && action === "toggle") throw new Error("You cannot disable your own account.");
  if (action === "toggle") {
    await db.user.update({ where: { id }, data: { active: !staff.active } });
    await audit(user.id, staff.active ? "DISABLE" : "ENABLE", "User", id);
  } else if (action === "reset-password") {
    const password = String(formData.get("password") ?? "");
    if (password.length < 12) throw new Error("Password must be at least 12 characters.");
    await db.user.update({ where: { id }, data: { passwordHash: await bcrypt.hash(password, 12) } });
    await audit(user.id, "RESET_PASSWORD", "User", id);
  } else if (action === "role") {
    const role = String(formData.get("role") ?? "") as Role;
    if (!Object.values(Role).includes(role)) throw new Error("Invalid role.");
    await db.user.update({ where: { id }, data: { role } });
    await audit(user.id, "UPDATE_ROLE", "User", id, { role });
  }
  revalidatePath("/staff");
}
export async function updateClinicSettingsAction(formData: FormData) {
  const user = await requireUser(); assert(user.role, "clinic:manage");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Clinic name is required.");
  const settings = await db.clinicSettings.upsert({ where: { id: "default" }, update: { name, address: String(formData.get("address") ?? "").trim() || null, phone: String(formData.get("phone") ?? "").trim() || null, email: String(formData.get("email") ?? "").trim() || null, prescriptionFooter: String(formData.get("prescriptionFooter") ?? "").trim() || null }, create: { id: "default", name, address: String(formData.get("address") ?? "").trim() || null, phone: String(formData.get("phone") ?? "").trim() || null, email: String(formData.get("email") ?? "").trim() || null, prescriptionFooter: String(formData.get("prescriptionFooter") ?? "").trim() || null } });
  await audit(user.id, "UPDATE", "ClinicSettings", settings.id); revalidatePath("/settings");
}
