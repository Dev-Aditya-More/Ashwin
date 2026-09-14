"use client";

import { Plus } from "lucide-react";
import { FormDialog } from "@/components/admin/FormDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  createVendorRecord,
  updateVendorRecord,
  addVendorBill,
  addVendorPayment,
} from "@/lib/actions/vendors";
import type { Vendor } from "@/lib/types";

export function AddVendorDialog() {
  return (
    <FormDialog
      trigger={
        <Button>
          <Plus className="size-4" /> Add Vendor
        </Button>
      }
      title="Add Vendor"
      action={createVendorRecord}
      submitLabel="Add Vendor"
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
        <Label htmlFor="category">Category</Label>
        <Input id="category" name="category" placeholder="e.g. Glass, Hardware, Aluminium" />
      </div>
    </FormDialog>
  );
}

export function EditVendorDialog({ vendor }: { vendor: Vendor }) {
  return (
    <FormDialog
      trigger={<Button variant="outline" size="sm">Edit</Button>}
      title="Edit Vendor"
      action={(fd) => updateVendorRecord(vendor.id, fd)}
    >
      <div className="space-y-1.5">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={vendor.name} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" defaultValue={vendor.phone ?? ""} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="category">Category</Label>
        <Input id="category" name="category" defaultValue={vendor.category ?? ""} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" defaultValue={vendor.notes ?? ""} rows={3} />
      </div>
    </FormDialog>
  );
}

export function AddVendorBillDialog({
  vendorId,
  projects,
}: {
  vendorId: string;
  projects: { id: string; name: string }[];
}) {
  return (
    <FormDialog
      trigger={
        <Button variant="outline" size="sm">
          <Plus className="size-4" /> Add Bill
        </Button>
      }
      title="Add Vendor Bill"
      action={(fd) => addVendorBill(vendorId, fd)}
      submitLabel="Add Bill"
    >
      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Input id="description" name="description" placeholder="e.g. 12mm toughened glass, 40 sqft" required />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="amount">Amount (₹)</Label>
          <Input id="amount" name="amount" type="number" min="0" step="0.01" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bill_date">Date</Label>
          <Input id="bill_date" name="bill_date" type="date" defaultValue={today()} />
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

export function AddVendorPaymentDialog({ vendorId }: { vendorId: string }) {
  return (
    <FormDialog
      trigger={
        <Button size="sm">
          <Plus className="size-4" /> Payment Made
        </Button>
      }
      title="Record Payment Made"
      action={(fd) => addVendorPayment(vendorId, fd)}
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
      <div className="space-y-1.5">
        <Label htmlFor="note">Note (optional)</Label>
        <Input id="note" name="note" placeholder="e.g. Bank transfer, cheque no." />
      </div>
    </FormDialog>
  );
}

function today() {
  return new Date().toISOString().slice(0, 10);
}
