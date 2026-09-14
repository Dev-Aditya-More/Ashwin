"use client";

import { Label } from "@/components/ui/label";

const MODES = ["Cash", "UPI", "Bank Transfer", "Cheque", "Other"];

export function PaymentModeSelect({ defaultValue = "" }: { defaultValue?: string }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor="payment_mode">Payment Mode</Label>
      <select
        id="payment_mode"
        name="payment_mode"
        defaultValue={defaultValue}
        className="w-full h-9 rounded-md border border-[var(--border)] bg-background px-3 text-sm"
      >
        <option value="">— Select —</option>
        {MODES.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
    </div>
  );
}

export function EntryTypeSelect({ defaultValue = "Payment" }: { defaultValue?: string }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor="entry_type">Entry Type</Label>
      <select
        id="entry_type"
        name="entry_type"
        defaultValue={defaultValue}
        className="w-full h-9 rounded-md border border-[var(--border)] bg-background px-3 text-sm"
      >
        <option value="Payment">Payment</option>
        <option value="Advance">Advance</option>
      </select>
    </div>
  );
}

export function ProjectSelect({
  projects,
  defaultValue = "",
}: {
  projects: { id: string; name: string }[];
  defaultValue?: string;
}) {
  if (projects.length === 0) return null;
  return (
    <div className="space-y-1.5">
      <Label htmlFor="project_id">Project / Site (optional)</Label>
      <select
        id="project_id"
        name="project_id"
        defaultValue={defaultValue}
        className="w-full h-9 rounded-md border border-[var(--border)] bg-background px-3 text-sm"
      >
        <option value="">— None —</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    </div>
  );
}
