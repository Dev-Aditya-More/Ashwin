"use client";

import { Plus, Pencil } from "lucide-react";
import { FormDialog } from "@/components/admin/FormDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { PaymentModeSelect, ProjectSelect } from "@/components/admin/dialogs/shared";
import {
  createVendorRecord,
  updateVendorRecord,
  addVendorBill,
  addVendorPayment,
  updateVendorBill,
  updateVendorPayment,
} from "@/lib/actions/vendors";
import { endOfCurrentMonth } from "@/lib/date-limits";
import type { Vendor, VendorBill, VendorPayment } from "@/lib/types";

type ProjectOption = { id: string; name: string };

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
      <div className="space-y-1.5">
        <Label htmlFor="opening_balance">Opening Balance (₹)</Label>
        <Input id="opening_balance" name="opening_balance" type="number" step="0.01" placeholder="e.g. 8000" />
        <p className="text-xs text-[var(--text-muted)]">
          What you already owe them, if carrying over from before.
        </p>
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
  projects: ProjectOption[];
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="description">Item / Material</Label>
          <Input id="description" name="description" placeholder="e.g. 12mm toughened glass, 40 sqft" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bill_no">Bill No.</Label>
          <Input id="bill_no" name="bill_no" placeholder="e.g. INV-2381" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="amount">Bill Amount (₹)</Label>
          <Input id="amount" name="amount" type="number" min="0" step="0.01" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bill_date">Date</Label>
          <Input id="bill_date" name="bill_date" type="date" defaultValue={today()} max={endOfCurrentMonth()} />
        </div>
      </div>
      <ProjectSelect projects={projects} />
    </FormDialog>
  );
}

export function EditVendorBillDialog({
  bill,
  vendorId,
  projects,
}: {
  bill: VendorBill;
  vendorId: string;
  projects: ProjectOption[];
}) {
  return (
    <FormDialog
      trigger={
        <Button variant="ghost" size="icon-sm" title="Edit">
          <Pencil className="size-3.5" />
        </Button>
      }
      title="Edit Vendor Bill"
      action={(fd) => updateVendorBill(bill.id, vendorId, fd)}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="description">Item / Material</Label>
          <Input id="description" name="description" defaultValue={bill.description} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bill_no">Bill No.</Label>
          <Input id="bill_no" name="bill_no" defaultValue={bill.bill_no ?? ""} />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="amount">Bill Amount (₹)</Label>
          <Input id="amount" name="amount" type="number" min="0" step="0.01" defaultValue={bill.amount} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bill_date">Date</Label>
          <Input id="bill_date" name="bill_date" type="date" defaultValue={bill.bill_date} max={endOfCurrentMonth()} />
        </div>
      </div>
      <ProjectSelect projects={projects} defaultValue={bill.project_id ?? ""} />
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
          <Input id="payment_date" name="payment_date" type="date" defaultValue={today()} max={endOfCurrentMonth()} />
        </div>
      </div>
      <PaymentModeSelect />
      <div className="space-y-1.5">
        <Label htmlFor="note">Note</Label>
        <Input id="note" name="note" placeholder="e.g. Cheque no., UTR ref." />
      </div>
    </FormDialog>
  );
}

export function EditVendorPaymentDialog({
  payment,
  vendorId,
}: {
  payment: VendorPayment;
  vendorId: string;
}) {
  return (
    <FormDialog
      trigger={
        <Button variant="ghost" size="icon-sm" title="Edit">
          <Pencil className="size-3.5" />
        </Button>
      }
      title="Edit Payment Made"
      action={(fd) => updateVendorPayment(payment.id, vendorId, fd)}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="amount">Amount (₹)</Label>
          <Input id="amount" name="amount" type="number" min="0" step="0.01" defaultValue={payment.amount} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="payment_date">Date</Label>
          <Input id="payment_date" name="payment_date" type="date" defaultValue={payment.payment_date} max={endOfCurrentMonth()} />
        </div>
      </div>
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
