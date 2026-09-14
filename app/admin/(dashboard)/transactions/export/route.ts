import { listTransactions } from "@/lib/actions/transactions";
import type { TransactionKind } from "@/lib/types";

const KIND_LABEL: Record<TransactionKind, string> = {
  client_work: "Work Billed",
  client_payment: "Payment Received",
  labour_work: "Work Entry",
  labour_payment: "Payment Made",
  vendor_bill: "Bill Added",
  vendor_payment: "Payment Made",
};

function csvEscape(value: string | number): string {
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(request: Request) {
  const month = new URL(request.url).searchParams.get("month") ?? undefined;
  const transactions = await listTransactions(5000, undefined, month);

  const header = ["Date", "Category", "Name", "Type", "Description", "Amount", "Direction", "Added By"];
  const rows = transactions.map((t) => [
    t.date,
    t.category,
    t.name,
    KIND_LABEL[t.kind],
    t.description,
    t.amount.toFixed(2),
    t.direction === "in" ? "Received" : t.direction === "out" ? "Paid" : "",
    t.addedBy ?? "",
  ]);

  const csv = [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\r\n");
  const filename = `ashwin-transactions-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
