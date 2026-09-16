"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { addBulkLabourPayments } from "@/lib/actions/labour";
import { formatMoney } from "@/lib/format";
import { endOfCurrentMonth } from "@/lib/date-limits";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Labourer = { id: string; name: string; balance: number; default_rate: number | null };

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function BulkPayForm({ labourers }: { labourers: Labourer[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await addBulkLabourPayments(formData);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`Recorded payments for ${result.count} worker${result.count === 1 ? "" : "s"}.`);
      formRef.current?.reset();
      router.push("/admin/labour");
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
        <div className="space-y-1.5">
          <Label htmlFor="payment_date">Payment Date</Label>
          <Input id="payment_date" name="payment_date" type="date" defaultValue={today()} max={endOfCurrentMonth()} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="note">Note (applies to all)</Label>
          <Input id="note" name="note" placeholder="e.g. Weekly wages" />
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Worker</TableHead>
              <TableHead>Currently Due</TableHead>
              <TableHead className="text-right">Amount to Pay (₹)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {labourers.map((l) => (
              <TableRow key={l.id}>
                <TableCell className="font-medium">{l.name}</TableCell>
                <TableCell className="text-[var(--text-muted)]">
                  {l.balance > 0 ? formatMoney(l.balance) : "Settled"}
                </TableCell>
                <TableCell className="text-right">
                  <Input
                    name={`amount_${l.id}`}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    className="w-32 ml-auto text-right"
                  />
                </TableCell>
              </TableRow>
            ))}
            {labourers.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-[var(--text-muted)] py-10">
                  No labourers yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Button type="submit" disabled={pending || labourers.length === 0}>
        {pending ? "Saving…" : "Record Payments"}
      </Button>
    </form>
  );
}
