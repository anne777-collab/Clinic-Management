"use client";

export function PrintButton() {
  return <button type="button" onClick={() => window.print()} className="rounded-xl bg-[#3766f5] px-4 py-2.5 text-sm font-bold text-white">Print prescription</button>;
}
