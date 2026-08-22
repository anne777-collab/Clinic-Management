"use client";

import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";

export function SubmitButton({ children, className = "", pendingLabel = "Saving...", disabled = false }: { children: React.ReactNode; className?: string; pendingLabel?: string; disabled?: boolean }) {
  const { pending } = useFormStatus();
  return <button disabled={pending || disabled} className={`inline-flex items-center justify-center gap-2 disabled:cursor-wait disabled:opacity-70 ${className}`}>
    {pending && <LoaderCircle size={16} className="animate-spin"/>}{pending ? pendingLabel : children}
  </button>;
}
