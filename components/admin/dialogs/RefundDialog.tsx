"use client";

import { todayIST } from "@/lib/today";

import { Undo2 } from "lucide-react";
import { FormDialog } from "@/components/admin/FormDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PaymentModeSelect } from "@/components/admin/dialogs/shared";
import { addClientPayment } from "@/lib/actions/clients";
import { addVendorPayment } from "@/lib/actions/vendors";
import { addLabourPayment } from "@/lib/actions/labour";
import { endOfCurrentMonth } from "@/lib/date-limits";

type Kind = "client" | "vendor" | "labour";

const COPY: Record<Kind, { title: string; help: string }> = {
  client: {
    title: "Record Refund to Client",
    help: "Money returned to the client. It adds back to what they owe you.",
  },
  vendor: {
    title: "Record Refund from Vendor",
    help: "Money the vendor returned to you. It adds back to what you owe them.",
  },
  labour: {
    title: "Record Refund from Labour",
    help: "Money the worker returned to you. It adds back to what you owe them.",
  },
};

/** Refund = a payment flowing the other way; stored with is_refund so balances move back up. */
export function AddRefundDialog({ kind, id }: { kind: Kind; id: string }) {
  const action = (fd: FormData) => {
    fd.set("is_refund", "1");
    return kind === "client" ? addClientPayment(id, fd) : kind === "vendor" ? addVendorPayment(id, fd) : addLabourPayment(id, fd);
  };
  const today = todayIST();

  return (
    <FormDialog
      trigger={
        <Button size="sm" variant="outline">
          <Undo2 className="size-4" /> Refund
        </Button>
      }
      title={COPY[kind].title}
      description={COPY[kind].help}
      action={action}
      submitLabel="Add Refund"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="amount">Amount (₹)</Label>
          <Input id="amount" name="amount" type="number" min="0" step="0.01" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="payment_date">Date</Label>
          <Input id="payment_date" name="payment_date" type="date" defaultValue={today} max={endOfCurrentMonth()} />
        </div>
      </div>
      <PaymentModeSelect />
      <div className="space-y-1.5">
        <Label htmlFor="note">Note</Label>
        <Input id="note" name="note" placeholder="Reason / reference" />
      </div>
    </FormDialog>
  );
}
