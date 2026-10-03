import Link from "next/link";
import {
  CalendarDays,
  Clock3,
  Plus,
  Users,
  type LucideIcon,
} from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { getPersonalizedGreeting } from "@/lib/personalization";

const day = new Date();
day.setHours(0, 0, 0, 0);
const tomorrow = new Date(day);
tomorrow.setDate(day.getDate() + 1);
export default async function Dashboard() {
  const user = await requireUser();
  const [appointments, waiting, followups, patients, queue] = await Promise.all(
    [
      db.appointment.count({ where: { startsAt: { gte: day, lt: tomorrow } } }),
      db.queueEntry.count({ where: { date: day, status: "WAITING" } }),
      db.visit.count({
        where: {
          followUpAt: { gte: day, lt: new Date(day.getTime() + 7 * 86400000) },
        },
      }),
      db.patient.count(),
      db.queueEntry.findMany({
        where: { date: day },
        include: { patient: true },
        orderBy: { token: "asc" },
        take: 8,
      }),
    ],
  );
  const stats: {
    value: number;
    label: string;
    Icon: LucideIcon;
    color: string;
  }[] = [
    {
      value: appointments,
      label: "Appointments today",
      Icon: CalendarDays,
      color: "#315ce7",
    },
    {
      value: waiting,
      label: "Patients waiting",
      Icon: Clock3,
      color: "#d88418",
    },
    {
      value: followups,
      label: "Follow-ups due",
      Icon: CalendarDays,
      color: "#8b5cf6",
    },
    {
      value: patients,
      label: "Patient records",
      Icon: Users,
      color: "#16a470",
    },
  ];
  return (
    <>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[#315ce7]">
            {new Intl.DateTimeFormat("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            }).format(new Date())}
          </p>
          <h1 className="mt-1 text-3xl font-bold">{getPersonalizedGreeting(user.name, user.role)}</h1>
          <p className="mt-1 text-sm text-slate-500">
            A clear view of today&apos;s care.
          </p>
        </div>
        <Link
          href="/patients/new"
          className="inline-flex items-center gap-2 rounded-xl bg-[#3766f5] px-4 py-2.5 text-sm font-bold text-white"
        >
          <Plus size={18} />
          New patient
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ value, label, Icon, color }) => (
          <article
            key={label}
            className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
          >
            <div className="flex justify-between">
              <div>
                <p className="text-3xl font-bold">{value}</p>
                <p className="mt-1 text-sm text-slate-500">{label}</p>
              </div>
              <Icon size={22} color={color} />
            </div>
          </article>
        ))}
      </div>
      <article className="mt-6 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="flex items-center justify-between p-5">
          <div>
            <h2 className="font-bold">Today&apos;s queue</h2>
            <p className="text-xs text-slate-400">
              Check in appointments to add them here.
            </p>
          </div>
          <Link href="/queue" className="text-sm font-bold text-[#315ce7]">
            Manage queue
          </Link>
        </div>
        {queue.length ? (
          <div className="divide-y divide-slate-100">
            {queue.map((entry) => (
              <div key={entry.id} className="flex items-center gap-4 px-5 py-4">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#edf1ff] text-sm font-bold text-[#315ce7]">
                  {entry.token}
                </span>
                <div className="flex-1">
                  <Link
                    href={`/patients/${entry.patientId}`}
                    className="font-semibold hover:text-[#315ce7]"
                  >
                    {entry.patient.firstName} {entry.patient.lastName}
                  </Link>
                  <p className="text-xs text-slate-400">
                    {entry.patient.patientNumber}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {entry.status.replace("_", " ")}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="p-8 text-center text-sm text-slate-400">
            No patients are in today&apos;s queue.
          </p>
        )}
      </article>
    </>
  );
}
