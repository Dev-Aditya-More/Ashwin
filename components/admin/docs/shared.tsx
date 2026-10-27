"use client";

import { useState, useTransition } from "react";
import { Plus, TriangleAlert, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createDocClient } from "@/lib/actions/documents";
import type { DocClient } from "@/lib/doc-types";

export const selectCls =
  "h-9 w-full rounded-md border border-[var(--border)] bg-background px-2 text-sm";

export function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export function SetupNotice() {
  return (
    <div className="flex gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
      <TriangleAlert className="size-4 shrink-0 mt-0.5" />
      <p>
        One-time database setup needed: open the Supabase SQL editor and run{" "}
        <code className="font-mono text-xs">supabase/migrations/0007_quotation_estimate_invoice.sql</code>, then
        refresh this page.
      </p>
    </div>
  );
}

/**
 * Phone layout for a saved document: who / what on top, then its buttons in an even two-column grid
 * (a table row squeezes them into a ragged pile). `corner` holds a small icon action such as Delete.
 */
export function DocCard({
  title,
  subtitle,
  amount,
  badge,
  corner,
  children,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  amount?: React.ReactNode;
  badge?: React.ReactNode;
  corner?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-sm break-words">{title}</p>
          {subtitle && <p className="text-xs text-[var(--text-muted)] mt-0.5 break-words">{subtitle}</p>}
          {badge && <div className="mt-1.5">{badge}</div>}
        </div>
        <div className="flex items-start gap-1 shrink-0">
          {amount && <p className="text-sm font-semibold whitespace-nowrap pt-0.5">{amount}</p>}
          {corner}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 [&>*]:w-full [&>*:last-child:nth-child(odd)]:col-span-2">{children}</div>
    </div>
  );
}

/** Wraps a list's cards: shown on phones only, the table takes over from `md` up. */
export function DocCardList({ empty, children }: { empty: string | false; children: React.ReactNode }) {
  return (
    <div className="md:hidden divide-y divide-[var(--border)]">
      {children}
      {empty && <p className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">{empty}</p>}
    </div>
  );
}

export const WORK_TYPES =["Civil", "Interior", "Civil & Interior", "Glass & Aluminium"];

/** Client dropdown with the "+ Add New Client" shortcut (name, optional mobile, address, GSTIN). */
export function ClientPicker({
  clients,
  value,
  onChange,
  onCreated,
}: {
  clients: DocClient[];
  value: string;
  onChange: (id: string) => void;
  onCreated: (c: DocClient) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({ name: "", phone: "", address: "", gstin: "" });
  const [error, setError] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const res = await createDocClient(form);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      onCreated(res.client);
      onChange(res.client.id);
      setForm({ name: "", phone: "", address: "", gstin: "" });
      setOpen(false);
      toast.success("New client saved");
    });
  }

  return (
    <>
      {/* The name gets the room; on a narrow column the button drops to its own line instead of squeezing it. */}
      <div className="flex flex-wrap gap-2">
        <select className={`${selectCls} flex-1 min-w-[12rem] w-auto`} value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">Select Client</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <Button type="button" variant="outline" className="shrink-0" onClick={() => setOpen(true)}>
          <Plus className="size-4" /> Add New Client
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <Field label="Client name">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </Field>
            <Field label="Mobile (optional)">
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
            <Field label="Billing address (optional)">
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </Field>
            <Field label="GSTIN (optional)">
              <Input
                value={form.gstin}
                maxLength={15}
                onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })}
              />
            </Field>
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <DialogFooter>
              <Button type="submit" disabled={pending}>
                {pending ? <Loader2 className="size-4 animate-spin" /> : null} Save Client
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
