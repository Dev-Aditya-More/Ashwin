"use client";

import { Plus } from "lucide-react";
import { FormDialog } from "@/components/admin/FormDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  createClientRecord,
  updateClientRecord,
  addClientWork,
  addClientPayment,
} from "@/lib/actions/clients";
import type { Client } from "@/lib/types";

export function AddClientDialog() {
  return (
    <FormDialog
      trigger={
        <Button>
          <Plus className="size-4" /> Add Client
        </Button>
      }
      title="Add Client"
      action={createClientRecord}
      submitLabel="Add Client"
    >
      <div className="space-y-1.5">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" placeholder="10-digit mobile number" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="address">Address / Site</Label>
        <Input id="address" name="address" />
      </div>
    </FormDialog>
  );
}

export function EditClientDialog({ client }: { client: Client }) {
  return (
    <FormDialog
      trigger={
        <Button variant="outline" size="sm">
          Edit
        </Button>
      }
      title="Edit Client"
      action={(fd) => updateClientRecord(client.id, fd)}
    >
      <div className="space-y-1.5">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={client.name} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" defaultValue={client.phone ?? ""} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="address">Address / Site</Label>
        <Input id="address" name="address" defaultValue={client.address ?? ""} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" defaultValue={client.notes ?? ""} rows={3} />
      </div>
    </FormDialog>
  );
}

export function AddClientWorkDialog({
  clientId,
  projects,
}: {
  clientId: string;
  projects: { id: string; name: string }[];
}) {
  return (
    <FormDialog
      trigger={
        <Button variant="outline" size="sm">
          <Plus className="size-4" /> Add Work
        </Button>
      }
      title="Add Work / Billed Amount"
      action={(fd) => addClientWork(clientId, fd)}
      submitLabel="Add Work"
    >
      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Input id="description" name="description" placeholder="e.g. Window glass fitting" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="amount">Amount (₹)</Label>
          <Input id="amount" name="amount" type="number" min="0" step="0.01" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="work_date">Date</Label>
          <Input id="work_date" name="work_date" type="date" defaultValue={today()} />
        </div>
      </div>
      {projects.length > 0 && (
        <div className="space-y-1.5">
          <Label htmlFor="project_id">Project / Site (optional)</Label>
          <select
            id="project_id"
            name="project_id"
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
      )}
    </FormDialog>
  );
}

export function AddClientPaymentDialog({
  clientId,
  projects,
}: {
  clientId: string;
  projects: { id: string; name: string }[];
}) {
  return (
    <FormDialog
      trigger={
        <Button size="sm">
          <Plus className="size-4" /> Payment Received
        </Button>
      }
      title="Record Payment Received"
      action={(fd) => addClientPayment(clientId, fd)}
      submitLabel="Add Payment"
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="amount">Amount (₹)</Label>
          <Input id="amount" name="amount" type="number" min="0" step="0.01" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="payment_date">Date</Label>
          <Input id="payment_date" name="payment_date" type="date" defaultValue={today()} />
        </div>
      </div>
      {projects.length > 0 && (
        <div className="space-y-1.5">
          <Label htmlFor="project_id">Project / Site (optional)</Label>
          <select
            id="project_id"
            name="project_id"
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
      )}
      <div className="space-y-1.5">
        <Label htmlFor="note">Note (optional)</Label>
        <Input id="note" name="note" placeholder="e.g. Cash, UPI, cheque no." />
      </div>
    </FormDialog>
  );
}

function today() {
  return new Date().toISOString().slice(0, 10);
}
