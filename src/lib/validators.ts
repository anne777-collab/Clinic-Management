import { z } from "zod";

const optionalDate = z.preprocess(
  (value) => value === "" || value === null ? undefined : value,
  z.coerce.date().optional(),
);

export const patientSchema = z.object({ firstName: z.string().min(1), lastName: z.string().min(1), mobile: z.string().regex(/^\+?[0-9\s-]{8,16}$/), email: z.string().email().optional().or(z.literal("")), dateOfBirth: optionalDate, gender: z.string().optional(), address: z.string().max(500).optional(), allergies: z.string().max(1000).optional() });
export const appointmentSchema = z.object({ patientId: z.string().min(1), startsAt: z.coerce.date(), durationMinutes: z.coerce.number().int().min(5).max(240), reason: z.string().max(500).optional() });
export const visitSchema = z.object({ patientId: z.string().min(1), chiefComplaint: z.string().max(2000).optional(), diagnosis: z.string().max(2000).optional(), clinicalNotes: z.string().max(10000).optional(), systolic: z.coerce.number().int().min(40).max(300).optional(), diastolic: z.coerce.number().int().min(20).max(200).optional(), temperature: z.coerce.number().min(25).max(45).optional(), weight: z.coerce.number().min(0.5).max(400).optional(), advice: z.string().max(5000).optional(), followUpAt: optionalDate });
export function appointmentOverlaps(existing: { startsAt: Date; endsAt: Date }[], startsAt: Date, durationMinutes: number) { const endsAt = new Date(startsAt.getTime() + durationMinutes * 60_000); return existing.some((item) => startsAt < item.endsAt && endsAt > item.startsAt); }
