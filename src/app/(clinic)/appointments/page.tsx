import Link from "next/link";
import { checkInAction, createAppointmentAction } from "@/app/actions/clinic";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { SubmitButton } from "@/components/submit-button";

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string; patient?: string }>;
}) {
  const params = await searchParams;
  const [patients, appointments, user] = await Promise.all([
    db.patient.findMany({ orderBy: { firstName: "asc" }, take: 100 }),
    db.appointment.findMany({
      include: { patient: true },
      orderBy: { startsAt: "asc" },
      take: 100,
    }),
    requireUser(),
  ]);
  const receptionist = user.role === "RECEPTIONIST" || user.role === "ADMIN";
  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Appointments</h1>
        <p className="mt-1 text-sm text-slate-500">
          Fixed time slots prevent conflicting consultations.
        </p>
      </div>
      {params.error === "conflict" && (
        <p className="mb-4 rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-700">
          That time overlaps an existing active appointment.
        </p>
      )}
      {params.success && (
        <p className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
          Appointment created.
        </p>
      )}
      {receptionist && (
        <form
          action={createAppointmentAction}
          className="mb-6 grid gap-3 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm md:grid-cols-4"
        >
          <select
            name="patientId"
            defaultValue={params.patient}
            required
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
          >
            <option value="">Select patient</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.firstName} {p.lastName} · {p.patientNumber}
              </option>
            ))}
          </select>
          <input
            name="startsAt"
            type="datetime-local"
            required
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
          />
          <select
            name="durationMinutes"
            defaultValue="20"
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
          >
            <option value="15">15 min</option>
            <option value="20">20 min</option>
            <option value="30">30 min</option>
            <option value="45">45 min</option>
            <option value="1">1 hr</option>
            <option value="2">2 hr</option>
          </select>
          <input
            name="reason"
            placeholder="Reason / visit type"
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
          />
          <SubmitButton
            pendingLabel="Booking..."
            className="rounded-xl bg-[#3766f5] px-4 py-2.5 text-sm font-bold text-white md:col-span-4"
          >
            Book appointment
          </SubmitButton>
        </form>
      )}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-5 py-3">When</th>
              <th className="px-5 py-3">Patient</th>
              <th className="px-5 py-3">Reason</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {appointments.map((a) => (
              <tr key={a.id} className="border-t border-slate-100">
                <td className="px-5 py-4 text-slate-600">
                  {a.startsAt.toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </td>
                <td className="px-5 py-4">
                  <Link
                    href={`/patients/${a.patientId}`}
                    className="font-semibold hover:text-[#315ce7]"
                  >
                    {a.patient.firstName} {a.patient.lastName}
                  </Link>
                </td>
                <td className="px-5 py-4 text-slate-500">{a.reason ?? "—"}</td>
                <td className="px-5 py-4">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold">
                    {a.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-5 py-4">
                  {receptionist && a.status === "SCHEDULED" && (
                    <form action={checkInAction}>
                      <input name="appointmentId" type="hidden" value={a.id} />
                      <SubmitButton
                        pendingLabel="Checking in..."
                        className="text-xs font-bold text-[#315ce7]"
                      >
                        Check in
                      </SubmitButton>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!appointments.length && (
          <p className="p-10 text-center text-sm text-slate-400">
            No appointments booked yet.
          </p>
        )}
      </div>
    </>
  );
}
