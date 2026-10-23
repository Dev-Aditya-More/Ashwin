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

export const WORK_TYPES = ["Civil", "Interior", "Civil & Interior", "Glass & Aluminium"];

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
      <div className="flex gap-2">
        <select className={selectCls} value={value} onChange={(e) => onChange(e.target.value)}>
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
