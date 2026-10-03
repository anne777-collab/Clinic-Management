"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { createPatientAction, findDuplicatePatientsAction } from "@/app/actions/clinic";
import { SubmitButton } from "@/components/submit-button";

export default function NewPatientPage() {
  const [canSubmit, setCanSubmit] = useState(false);
  const [duplicates, setDuplicates] = useState<{ id: string; firstName: string; lastName: string; patientNumber: string; dateOfBirth: Date | null }[]>([]);
  const [checking, startChecking] = useTransition();
  const checkMobile = (mobile: string) => startChecking(async () => setDuplicates(await findDuplicatePatientsAction(mobile)));
  return (
    <>
      <div className="mb-6">
        <Link href="/patients" className="text-sm font-semibold text-[#315ce7]">
          ← Back to patients
        </Link>
        <h1 className="mt-3 text-2xl font-bold">Register patient</h1>
        <p className="mt-1 text-sm text-slate-500">
          Fields marked <span className="font-bold text-red-500">*</span> are
          required. A matching mobile number is allowed but should be verified
          first.
        </p>
      </div>
      <form
        action={createPatientAction}
        onInput={(event) => setCanSubmit(event.currentTarget.checkValidity())}
        className="max-w-3xl space-y-5 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            ["firstName", "First name", true],
            ["lastName", "Last name", false],
            ["mobile", "Mobile number", true],
            ["email", "Email", false],
            ["dateOfBirth", "Date of birth", false],
            ["gender", "Gender", false],
          ].map(([name, label, required]) => (
            <label key={String(name)} className="text-sm font-semibold">
              {String(label)}
              {Boolean(required) && (
                <span aria-label="required" className="ml-1 text-red-500">
                  *
                </span>
              )}
              <input
                name={String(name)}
                required={Boolean(required)}
                onBlur={name === "mobile" ? (event) => checkMobile(event.currentTarget.value) : undefined}
                type={
                  name === "dateOfBirth"
                    ? "date"
                    : name === "email"
                      ? "email"
                      : "text"
                }
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-[#3766f5]"
              />
            </label>
          ))}
        </div>
        {(checking || duplicates.length > 0) && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm"><p className="font-bold text-amber-900">{checking ? "Checking for an existing patient…" : "Possible duplicate patient"}</p>{duplicates.map((patient) => <Link key={patient.id} href={`/patients/${patient.id}`} className="mt-2 block rounded-lg bg-white p-2 text-amber-900 hover:bg-amber-100"><b>{patient.firstName} {patient.lastName}</b> · {patient.patientNumber}{patient.dateOfBirth ? ` · DOB ${new Date(patient.dateOfBirth).toLocaleDateString()}` : ""}</Link>)}{duplicates.length > 0 && <p className="mt-2 text-xs text-amber-800">Review the existing record before creating a separate patient.</p>}</div>}
        <label className="block text-sm font-semibold">
          Address
          <textarea
            name="address"
            rows={2}
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-[#3766f5]"
          />
        </label>
        <label className="block text-sm font-semibold">
          Known allergies
          <textarea
            name="allergies"
            rows={2}
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-[#3766f5]"
            placeholder="No known allergies"
          />
        </label>
        <SubmitButton
          disabled={!canSubmit}
          pendingLabel="Creating..."
          className="rounded-xl bg-[#3766f5] px-5 py-3 text-sm font-bold text-white"
        >
          Create patient record
        </SubmitButton>
      </form>
    </>
  );
}
