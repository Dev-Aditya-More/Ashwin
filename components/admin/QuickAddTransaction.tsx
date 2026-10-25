"use client";

import { todayIST } from "@/lib/today";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addClientPayment, addClientWork } from "@/lib/actions/clients";
import { addLabourPayment, addLabourWork } from "@/lib/actions/labour";
import { addVendorBill, addVendorPayment } from "@/lib/actions/vendors";
import { updateClientGstin } from "@/lib/actions/month-view";
import { GSTIN_RE } from "@/lib/doc-calc";
import { endOfCurrentMonth } from "@/lib/date-limits";

type PartyType = "Client" | "Labour" | "Vendor";
type Kind = "due" | "received" | "paid" | "refund";
export type QuickParty = { id: string; name: string; gstin?: string | null };

const MODES = ["Cash", "PhonePe", "GPay", "NEFT", "RTGS", "Cheque", "Other"];
const selectCls = "h-9 w-full rounded-md border border-[var(--border)] bg-background px-2 text-sm";
const today = () => todayIST();

const KINDS: Record<PartyType, { value: Kind; label: string }[]> = {
  Client: [
    { value: "due", label: "Due / payable added" },
    { value: "received", label: "Payment received (client)" },
    { value: "refund", label: "Refund / Refund Issued" },
  ],
  Labour: [
    { value: "due", label: "Due / payable added" },
    { value: "paid", label: "Payment paid (labour/vendor)" },
    { value: "refund", label: "Refund / Refund Issued" },
  ],
  Vendor: [
    { value: "due", label: "Due / payable added" },
    { value: "paid", label: "Payment paid (labour/vendor)" },
    { value: "refund", label: "Refund / Refund Issued" },
  ],
};

/** Dashboard "Quick Add Transaction": one form for dues, payments and refunds of any party type. */
export function QuickAddTransaction({
  clients,
  labourers,
  vendors,
}: {
  clients: QuickParty[];
  labourers: QuickParty[];
  vendors: QuickParty[];
}) {
  const [type, setType] = useState<PartyType>("Client");
  const [partyId, setPartyId] = useState("");
  const [amount, setAmount] = useState("");
  const [kind, setKind] = useState<Kind>("due");
  const [date, setDate] = useState(today());
  const [mode, setMode] = useState("Cash");
  const [note, setNote] = useState("");
  const [gstin, setGstin] = useState("");
  const [pending, startTransition] = useTransition();

  const parties = type === "Client" ? clients : type === "Labour" ? labourers : vendors;
  const party = useMemo(() => parties.find((p) => p.id === partyId), [parties, partyId]);

  function changeType(t: PartyType) {
    setType(t);
    setPartyId("");
    setGstin("");
    if (!KINDS[t].some((k) => k.value === kind)) setKind("due");
  }

  function changeParty(id: string) {
    setPartyId(id);
    setGstin(type === "Client" ? parties.find((p) => p.id === id)?.gstin ?? "" : "");
  }

  async function send(confirm: boolean) {
    const fd = new FormData();
    fd.set("amount", amount);
    fd.set("note", note.trim());
    if (confirm) fd.set("confirm", "1");

    if (kind === "due") {
      const desc = note.trim() || "Due added";
      fd.set("description", desc);
      fd.set("bill_date", date);
      fd.set("work_date", date);
      if (type === "Labour") {
        fd.set("quantity", "1");
        fd.set("rate", amount);
      }
      return type === "Client"
        ? addClientWork(partyId, fd)
        : type === "Labour"
        ? addLabourWork(partyId, fd)
        : addVendorBill(partyId, fd);
    }
    fd.set("payment_date", date);
    fd.set("payment_mode", mode);
    if (kind === "refund") fd.set("is_refund", "1");
    return type === "Client"
      ? addClientPayment(partyId, fd)
      : type === "Labour"
      ? addLabourPayment(partyId, fd)
      : addVendorPayment(partyId, fd);
  }

  function save() {
    const amt = Number(amount);
    if (!partyId || !(amt > 0)) {
      toast.error("Choose a party and enter an amount greater than zero.");
      return;
    }
    const g = gstin.trim().toUpperCase();
    if (type === "Client" && g && !GSTIN_RE.test(g)) {
      toast.error("GSTIN must contain exactly 15 letters/numbers.");
      return;
    }
    startTransition(async () => {
      let res = await send(false);
      if (res && "warning" in res && res.warning) {
        if (!window.confirm(`${res.warning}\n\nAdd anyway?`)) return;
        res = await send(true);
        if (res && "warning" in res && res.warning) {
          toast.error(res.warning);
          return;
        }
      }
      if (type === "Client" && g && g !== (party?.gstin ?? "")) await updateClientGstin(partyId, g);
      toast.success("Transaction saved. Please verify the party balance.");
      setAmount("");
      setNote("");
      setPartyId("");
      setGstin("");
    });
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-2)] flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold text-sm">Quick Add Transaction</p>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/transactions/export" prefetch={false}>
            <Download className="size-4" /> Export Transactions CSV
          </Link>
        </Button>
      </div>
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="space-y-1.5">
            <Label>Party Type</Label>
            <select className={selectCls} value={type} onChange={(e) => changeType(e.target.value as PartyType)}>
              <option>Client</option>
              <option>Labour</option>
              <option>Vendor</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Party Name</Label>
            <select className={selectCls} value={partyId} onChange={(e) => changeParty(e.target.value)}>
              <option value="">Choose Party</option>
              {parties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Amount (₹)</Label>
            <Input type="number" min="0.01" step="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Transaction</Label>
            <select className={selectCls} value={kind} onChange={(e) => setKind(e.target.value as Kind)}>
              {KINDS[type].map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input type="date" value={date} max={endOfCurrentMonth()} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Payment Mode</Label>
            <select className={selectCls} value={mode} onChange={(e) => setMode(e.target.value)} disabled={kind === "due"}>
              {MODES.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Bill / Site / Note</Label>
            <Input placeholder="Site, bill number, details" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Client GSTIN (auto-filled)</Label>
            <Input
              placeholder="Client GSTIN"
              maxLength={15}
              value={gstin}
              disabled={type !== "Client"}
              onChange={(e) => setGstin(e.target.value.toUpperCase())}
            />
          </div>
        </div>
        <Button onClick={save} disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />} Save Transaction
        </Button>
        <p className="text-xs text-[var(--text-muted)]">
          Refund: record money returned to a party. A refund adds back to the party&apos;s balance (client refunds
          increase what they owe; vendor/labour refunds increase what you owe them).
        </p>
      </div>
    </div>
  );
}
