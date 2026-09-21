"use client";

import { Plus, Pencil } from "lucide-react";
import { FormDialog } from "@/components/admin/FormDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { PaymentModeSelect, ProjectSelect } from "@/components/admin/dialogs/shared";
import {
  createClientRecord,
  updateClientRecord,
  addClientWork,
  addClientPayment,
  updateClientWork,
  updateClientPayment,
} from "@/lib/actions/clients";
import { endOfCurrentMonth } from "@/lib/date-limits";
import type { Client, ClientWork, ClientPayment } from "@/lib/types";

type ProjectOption = { id: string; name: string };

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
      <div className="space-y-1.5">
        <Label htmlFor="opening_balance">Opening Balance (₹)</Label>
        <Input id="opening_balance" name="opening_balance" type="number" step="0.01" placeholder="e.g. 15000" />
        <p className="text-xs text-[var(--text-muted)]">
          What they already owe you, if carrying over from before.
        </p>
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
  projects: ProjectOption[];
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
      <div className="space-y-1.5">
        <Label htmlFor="bill_no">Bill No.</Label>
        <Input id="bill_no" name="bill_no" placeholder="e.g. INV-2381" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="amount">Amount (₹)</Label>
          <Input id="amount" name="amount" type="number" min="0" step="0.01" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="work_date">Date</Label>
          <Input id="work_date" name="work_date" type="date" defaultValue={today()} max={endOfCurrentMonth()} />
        </div>
      </div>
      <ProjectSelect projects={projects} />
    </FormDialog>
  );
}

export function EditClientWorkDialog({
  work,
  clientId,
  projects,
}: {
  work: ClientWork;
  clientId: string;
  projects: ProjectOption[];
}) {
  return (
    <FormDialog
      trigger={
        <Button variant="ghost" size="icon-sm" title="Edit">
          <Pencil className="size-3.5" />
        </Button>
      }
      title="Edit Work / Billed Amount"
      action={(fd) => updateClientWork(work.id, clientId, fd)}
    >
      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Input id="description" name="description" defaultValue={work.description} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="bill_no">Bill No.</Label>
        <Input id="bill_no" name="bill_no" defaultValue={work.bill_no ?? ""} placeholder="e.g. INV-2381" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="amount">Amount (₹)</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            min="0"
            step="0.01"
            defaultValue={work.amount}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="work_date">Date</Label>
          <Input id="work_date" name="work_date" type="date" defaultValue={work.work_date} max={endOfCurrentMonth()} />
        </div>
      </div>
      <ProjectSelect projects={projects} defaultValue={work.project_id ?? ""} />
    </FormDialog>
  );
}

export function AddClientPaymentDialog({
  clientId,
  projects,
}: {
  clientId: string;
  projects: ProjectOption[];
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="amount">Amount (₹)</Label>
          <Input id="amount" name="amount" type="number" min="0" step="0.01" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="payment_date">Date</Label>
          <Input id="payment_date" name="payment_date" type="date" defaultValue={today()} max={endOfCurrentMonth()} />
        </div>
      </div>
      <ProjectSelect projects={projects} />
      <PaymentModeSelect />
      <div className="space-y-1.5">
        <Label htmlFor="note">Note</Label>
        <Input id="note" name="note" placeholder="e.g. Cheque no., UTR ref." />
      </div>
    </FormDialog>
  );
}

export function EditClientPaymentDialog({
  payment,
  clientId,
  projects,
}: {
  payment: ClientPayment;
  clientId: string;
  projects: ProjectOption[];
}) {
  return (
    <FormDialog
      trigger={
        <Button variant="ghost" size="icon-sm" title="Edit">
          <Pencil className="size-3.5" />
        </Button>
      }
      title="Edit Payment Received"
      action={(fd) => updateClientPayment(payment.id, clientId, fd)}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="amount">Amount (₹)</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            min="0"
            step="0.01"
            defaultValue={payment.amount}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="payment_date">Date</Label>
          <Input id="payment_date" name="payment_date" type="date" defaultValue={payment.payment_date} max={endOfCurrentMonth()} />
        </div>
      </div>
      <ProjectSelect projects={projects} defaultValue={payment.project_id ?? ""} />
      <PaymentModeSelect defaultValue={payment.payment_mode ?? ""} />
      <div className="space-y-1.5">
        <Label htmlFor="note">Note</Label>
        <Input id="note" name="note" defaultValue={payment.note ?? ""} placeholder="e.g. Cheque no., UTR ref." />
      </div>
    </FormDialog>
  );
}

function today() {
  return new Date().toISOString().slice(0, 10);
}
