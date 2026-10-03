import type { AppRole } from "./authorization";

const clinicTimeZone = "Asia/Kolkata";

export function getTimeOfDayGreeting(now = new Date()) {
  const hour = Number(new Intl.DateTimeFormat("en-IN", {
    timeZone: clinicTimeZone,
    hour: "numeric",
    hourCycle: "h23",
  }).format(now));

  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function getPersonalizedGreeting(name: string, role: AppRole, now = new Date()) {
  const displayName = role === "DOCTOR" && !name.trim().toLowerCase().startsWith("dr.") ? `Dr. ${name}` : name;
  return `${getTimeOfDayGreeting(now)}, ${displayName} 👋`;
}

export function getRoleLabel(role: AppRole) {
  return role === "RECEPTIONIST" ? "Receptionist" : role === "DOCTOR" ? "Doctor" : "Admin";
}
