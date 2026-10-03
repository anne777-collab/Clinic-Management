import { updateClinicSettingsAction } from "@/app/actions/clinic";
import { SubmitButton } from "@/components/submit-button";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const user = await requireUser(); if (user.role !== "ADMIN") redirect("/");
  const settings = await db.clinicSettings.findUnique({ where: { id: "default" } });
  return <><div className="mb-6"><h1 className="text-2xl font-bold">Clinic settings</h1><p className="mt-1 text-sm text-slate-500">Maintain clinic details used by your staff and prescription printouts.</p></div><form action={updateClinicSettingsAction} className="max-w-3xl space-y-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold">Clinic name<input name="name" required defaultValue={settings?.name ?? "Shiva Dental Clinic"} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal"/></label><label className="text-sm font-semibold">Phone<input name="phone" defaultValue={settings?.phone ?? ""} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal"/></label><label className="text-sm font-semibold sm:col-span-2">Email<input name="email" type="email" defaultValue={settings?.email ?? ""} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal"/></label></div><label className="block text-sm font-semibold">Clinic address<textarea name="address" rows={3} defaultValue={settings?.address ?? ""} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal"/></label><label className="block text-sm font-semibold">Prescription footer<textarea name="prescriptionFooter" rows={2} defaultValue={settings?.prescriptionFooter ?? ""} placeholder="For appointments, contact the clinic." className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal"/></label><SubmitButton pendingLabel="Saving..." className="rounded-xl bg-[#3766f5] px-5 py-3 text-sm font-bold text-white">Save clinic settings</SubmitButton></form></>;
}
