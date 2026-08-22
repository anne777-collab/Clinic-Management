export type AppRole = "ADMIN" | "DOCTOR" | "RECEPTIONIST";
export const permissions: Record<AppRole, string[]> = { ADMIN: ["users:manage", "clinic:manage", "audit:read", "patients:read", "medicines:manage"], DOCTOR: ["patients:read", "visits:write", "prescriptions:write", "queue:manage", "medicines:read"], RECEPTIONIST: ["patients:write", "appointments:write", "queue:manage", "followups:read", "patients:read"] };
export const can = (role: AppRole, permission: string) => permissions[role].includes(permission);
