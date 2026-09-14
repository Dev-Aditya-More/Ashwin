"use client";

import { Plus, Pencil } from "lucide-react";
import { FormDialog } from "@/components/admin/FormDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { PaymentModeSelect, ProjectSelect, EntryTypeSelect } from "@/components/admin/dialogs/shared";
import {
  createLabourerRecord,
  updateLabourerRecord,
  addLabourWork,
  addLabourPayment,
  updateLabourWork,
  updateLabourPayment,
} from "@/lib/actions/labour";
import type { Labourer, LabourPayment } from "@/lib/types";
import type { LabourWorkWithSite } from "@/lib/actions/labour";

type ProjectOption = { id: string; name: string };

export function AddLabourerDialog() {
  return (
    <FormDialog
      trigger={
        <Button>
          <Plus className="size-4" /> Add Labour
        </Button>
      }
      title="Add Labourer"
      action={createLabourerRecord}
      submitLabel="Add Labourer"
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
        <Label htmlFor="default_rate">Default Rate (₹, optional)</Label>
        <Input id="default_rate" name="default_rate" type="number" min="0" step="0.01" />
      </div>
    </FormDialog>
  );
}

export function EditLabourerDialog({ labourer }: { labourer: Labourer }) {
  return (
    <FormDialog
      trigger={<Button variant="outline" size="sm">Edit</Button>}
      title="Edit Labourer"
      action={(fd) => updateLabourerRecord(labourer.id, fd)}
    >
      <div className="space-y-1.5">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={labourer.name} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" defaultValue={labourer.phone ?? ""} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="default_rate">Default Rate (₹)</Label>
        <Input
          id="default_rate"
          name="default_rate"
          type="number"
          min="0"
          step="0.01"
          defaultValue={labourer.default_rate ?? ""}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" defaultValue={labourer.notes ?? ""} rows={3} />
      </div>
    </FormDialog>
  );
}

export function AddLabourWorkDialog({
  labourerId,
  projects,
  defaultRate,
}: {
  labourerId: string;
  projects: ProjectOption[];
  defaultRate: number | null;
}) {
  return (
    <FormDialog
      trigger={
        <Button variant="outline" size="sm">
          <Plus className="size-4" /> Add Work
        </Button>
      }
      title="Add Work Entry"
      description="Amount = Quantity × Rate"
      action={(fd) => addLabourWork(labourerId, fd)}
      submitLabel="Add Work"
    >
      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Input id="description" name="description" placeholder="e.g. Glass cutting, 2 days" required />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="quantity">Quantity</Label>
          <Input id="quantity" name="quantity" type="number" min="0" step="0.01" defaultValue="1" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rate">Rate (₹)</Label>
          <Input
            id="rate"
            name="rate"
            type="number"
            min="0"
            step="0.01"
            defaultValue={defaultRate ?? ""}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="work_date">Date</Label>
          <Input id="work_date" name="work_date" type="date" defaultValue={today()} />
        </div>
      </div>
      <ProjectSelect projects={projects} />
    </FormDialog>
  );
}

export function EditLabourWorkDialog({
  work,
  labourerId,
  projects,
}: {
  work: LabourWorkWithSite;
  labourerId: string;
  projects: ProjectOption[];
}) {
  return (
    <FormDialog
      trigger={
        <Button variant="ghost" size="icon-sm" title="Edit">
          <Pencil className="size-3.5" />
        </Button>
      }
      title="Edit Work Entry"
      description="Amount = Quantity × Rate"
      action={(fd) => updateLabourWork(work.id, labourerId, fd)}
    >
      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Input id="description" name="description" defaultValue={work.description} required />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="quantity">Quantity</Label>
          <Input id="quantity" name="quantity" type="number" min="0" step="0.01" defaultValue={work.quantity} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rate">Rate (₹)</Label>
          <Input id="rate" name="rate" type="number" min="0" step="0.01" defaultValue={work.rate} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="work_date">Date</Label>
          <Input id="work_date" name="work_date" type="date" defaultValue={work.work_date} />
        </div>
      </div>
      <ProjectSelect projects={projects} defaultValue={work.project_id ?? ""} />
    </FormDialog>
  );
}

export function AddLabourPaymentDialog({ labourerId }: { labourerId: string }) {
  return (
    <FormDialog
      trigger={
        <Button size="sm">
          <Plus className="size-4" /> Payment Made
        </Button>
      }
      title="Record Payment Made"
      action={(fd) => addLabourPayment(labourerId, fd)}
      submitLabel="Add Payment"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="amount">Amount (₹)</Label>
          <Input id="amount" name="amount" type="number" min="0" step="0.01" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="payment_date">Date</Label>
          <Input id="payment_date" name="payment_date" type="date" defaultValue={today()} />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <EntryTypeSelect />
        <PaymentModeSelect />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="note">Note (optional)</Label>
        <Input id="note" name="note" placeholder="e.g. Weekly wages" />
      </div>
    </FormDialog>
  );
}

export function EditLabourPaymentDialog({
  payment,
  labourerId,
}: {
  payment: LabourPayment;
  labourerId: string;
}) {
  return (
    <FormDialog
      trigger={
        <Button variant="ghost" size="icon-sm" title="Edit">
          <Pencil className="size-3.5" />
        </Button>
      }
      title="Edit Payment Made"
      action={(fd) => updateLabourPayment(payment.id, labourerId, fd)}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="amount">Amount (₹)</Label>
          <Input id="amount" name="amount" type="number" min="0" step="0.01" defaultValue={payment.amount} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="payment_date">Date</Label>
          <Input id="payment_date" name="payment_date" type="date" defaultValue={payment.payment_date} />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <EntryTypeSelect defaultValue={payment.entry_type ?? "Payment"} />
        <PaymentModeSelect defaultValue={payment.payment_mode ?? ""} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="note">Note (optional)</Label>
        <Input id="note" name="note" defaultValue={payment.note ?? ""} placeholder="e.g. Weekly wages" />
      </div>
    </FormDialog>
  );
}

function today() {
  return new Date().toISOString().slice(0, 10);
}
