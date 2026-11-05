"use client";

import { todayIST } from "@/lib/today";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Download, Loader2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addClientPayment, addClientWork } from "@/lib/actions/clients";
import { addLabourPayment, addLabourWork } from "@/lib/actions/labour";
import { addVendorBill, addVendorPayment } from "@/lib/actions/vendors";
import { ScanBillButton } from "@/components/admin/ScanBillButton";
import type { ScannedBill } from "@/lib/scan-bill";
import { updateClientGstin } from "@/lib/actions/month-view";
import { GSTIN_RE } from "@/lib/doc-calc";
import { endOfCurrentMonth } from "@/lib/date-limits";

type PartyType = "Client" | "Labour" | "Vendor";
type Kind = "due" | "received" | "paid" | "refund";
export type QuickParty = { id: string; name: string; gstin?: string | null };

const MODES = ["Cash", "PhonePe", "GPay", "NEFT", "RTGS", "Cheque", "Other"];
const selectCls = "h-9 w-full rounded-md border border-[var(--border)] bg-background px-2 text-sm";
const today = () => todayIST();
const words = (t: string) => t.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 2);

/** The vendor whose name shares the most words with the scanned supplier name (null when none is close). */
function matchVendor(vendors: QuickParty[], scanned: string) {
  const a = words(scanned);
  let best: QuickParty | null = null;
  let top = 0;
  for (const v of vendors) {
    const score = words(v.name).filter((w) => a.includes(w)).length;
    if (score > top) {
      top = score;
      best = v;
    }
  }
  return best;
}

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
  const [billNo, setBillNo] = useState("");
  const [taxable, setTaxable] = useState("");
  const [gstAmt, setGstAmt] = useState("");
  const [scanNotes, setScanNotes] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();

  const parties = type === "Client" ? clients : type === "Labour" ? labourers : vendors;
  const party = useMemo(() => parties.find((p) => p.id === partyId), [parties, partyId]);
  /** A vendor bill carries the supplier's GST details; every other kind of entry doesn't. */
  const vendorBill = type === "Vendor" && kind === "due";

  /** Scan Bill reads a supplier's purchase bill, so it always lands as a Vendor "Due / payable added". */
  function applyScan(b: ScannedBill, notes: string[]) {
    const out = [...notes];
    setType("Vendor");
    setKind("due");
    setGstin(b.vendorGstin);
    setBillNo(b.billNo);
    setTaxable(b.taxable != null ? String(b.taxable) : "");
    setGstAmt(b.gst != null ? String(b.gst) : "");
    if (b.total != null) setAmount(String(b.total));
    if (b.billDate) setDate(b.billDate);
    setNote(b.description);
    const v = b.vendorName ? matchVendor(vendors, b.vendorName) : null;
    setPartyId(v?.id ?? "");
    if (v) out.unshift(`Vendor matched: ${v.name}.`);
    else out.unshift(b.vendorName ? `Couldn't match "${b.vendorName}" to a saved vendor. Please choose the vendor (or add them first).` : "Please choose the vendor.");
    out.unshift("Bill scanned. Please check the filled-in details before saving.");
    setScanNotes(out);
  }

  function changeType(t: PartyType) {
    setType(t);
    setPartyId("");
    setGstin("");
    setScanNotes([]);
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
      if (vendorBill) {
        fd.set("bill_no", billNo.trim());
        fd.set("vendor_gstin", gstin.trim().toUpperCase());
        fd.set("taxable_amount", taxable);
        fd.set("gst_amount", gstAmt);
      }
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
    if ((type === "Client" || vendorBill) && g && !GSTIN_RE.test(g)) {
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
      setBillNo("");
      setTaxable("");
      setGstAmt("");
      setScanNotes([]);
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
        <ScanBillButton onScanned={applyScan} />
        {scanNotes.length > 0 && (
          <ul className="space-y-1 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900">
            {scanNotes.map((n, i) => (
              <li key={i} className="flex gap-1.5">
                <TriangleAlert className="size-3.5 shrink-0 mt-px" /> {n}
              </li>
            ))}
          </ul>
        )}
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
            <Input type="date" className="min-w-0 max-w-full" value={date} max={endOfCurrentMonth()} onChange={(e) => setDate(e.target.value)} />
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
            <Label>{vendorBill ? "Vendor GSTIN" : "Client GSTIN (auto-filled)"}</Label>
            <Input
              placeholder={vendorBill ? "Vendor GSTIN (optional)" : "Client GSTIN"}
              maxLength={15}
              value={gstin}
              disabled={type !== "Client" && !vendorBill}
              onChange={(e) => setGstin(e.target.value.toUpperCase())}
            />
          </div>
          {vendorBill && (
            <>
              <div className="space-y-1.5">
                <Label>Bill No.</Label>
                <Input placeholder="Supplier bill number" value={billNo} onChange={(e) => setBillNo(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Taxable (₹)</Label>
                <Input type="number" min="0" step="0.01" placeholder="Optional" value={taxable} onChange={(e) => setTaxable(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>GST (₹)</Label>
                <Input type="number" min="0" step="0.01" placeholder="CGST+SGST / IGST" value={gstAmt} onChange={(e) => setGstAmt(e.target.value)} />
              </div>
            </>
          )}
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
