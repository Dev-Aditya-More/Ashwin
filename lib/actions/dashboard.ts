"use server";

import { createClient } from "@/lib/supabase/server";
import type {
  ClientBalance,
  LabourBalance,
  VendorBalance,
  Transaction,
} from "@/lib/types";

export type ActivityRow = {
  id: string;
  name: string;
  label: string;
  amount: number;
  direction: "in" | "out" | "neutral";
  date: string;
};

export type DashboardData = {
  clientReceivable: number;
  vendorPayable: number;
  labourDue: number;
  netPosition: number;
  totalRevenue: number;
  totalLabourCost: number;
  totalVendorCost: number;
  activeAccounts: number;
  clientActivity: ActivityRow[];
  labourActivity: ActivityRow[];
  vendorActivity: ActivityRow[];
  monthly: { month: string; revenue: number; labour: number; vendor: number }[];
};

function sum(rows: { balance: number }[] | null) {
  return (rows ?? []).reduce((acc, r) => acc + Number(r.balance), 0);
}

/**
 * Everything below fires in ONE Promise.all batch — a single network
 * round trip to Supabase — rather than being split across several
 * sequential awaits. That's the difference between the dashboard
 * feeling instant vs. feeling like it's loading in stages.
 */
export async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createClient();

  const [
    activeFy,
    clientBalances,
    labourBalances,
    vendorBalances,
    clients,
    labourers,
    vendors,
    clientWork,
    labourWork,
    vendorBills,
    recentTxns,
  ] = await Promise.all([
    supabase.from("financial_years").select("*").eq("is_active", true).maybeSingle(),
    supabase.from("client_balances").select("*"),
    supabase.from("labour_balances").select("*"),
    supabase.from("vendor_balances").select("*"),
    supabase.from("clients").select("id, name"),
    supabase.from("labourers").select("id, name"),
    supabase.from("vendors").select("id, name"),
    supabase.from("client_work").select("amount, work_date, financial_year_id"),
    supabase.from("labour_work").select("amount, work_date, financial_year_id"),
    supabase.from("vendor_bills").select("amount, bill_date, financial_year_id"),
    supabase
      .from("all_transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(60),
  ]);

  const fyId = activeFy.data?.id ?? null;
  const startDate = activeFy.data?.start_date ?? "1970-01-01";
  const endDate = activeFy.data?.end_date ?? "2999-12-31";

  const clientWorkFy = (clientWork.data ?? []).filter((r) => r.financial_year_id === fyId);
  const labourWorkFy = (labourWork.data ?? []).filter((r) => r.financial_year_id === fyId);
  const vendorBillsFy = (vendorBills.data ?? []).filter((r) => r.financial_year_id === fyId);

  const clientReceivable = sum(clientBalances.data as ClientBalance[]);
  const labourDue = sum(labourBalances.data as LabourBalance[]);
  const vendorPayable = sum(vendorBalances.data as VendorBalance[]);

  const totalRevenue = clientWorkFy.reduce((a, r) => a + Number(r.amount), 0);
  const totalLabourCost = labourWorkFy.reduce((a, r) => a + Number(r.amount), 0);
  const totalVendorCost = vendorBillsFy.reduce((a, r) => a + Number(r.amount), 0);

  const clientNames = new Map((clients.data ?? []).map((c) => [c.id, c.name]));
  const labourNames = new Map((labourers.data ?? []).map((l) => [l.id, l.name]));
  const vendorNames = new Map((vendors.data ?? []).map((v) => [v.id, v.name]));

  const allTxns = (recentTxns.data ?? []) as Transaction[];
  const clientTxns = allTxns.filter((t) => t.kind.startsWith("client_")).slice(0, 4);
  const labourTxns = allTxns.filter((t) => t.kind.startsWith("labour_")).slice(0, 4);
  const vendorTxns = allTxns.filter((t) => t.kind.startsWith("vendor_")).slice(0, 4);

  const toActivity = (
    rows: Transaction[],
    names: Map<string, string>,
    paymentDirection: "in" | "out",
    workLabel: string
  ): ActivityRow[] =>
    rows.map((t) => ({
      id: t.id,
      name: names.get(t.entity_id) ?? "Unknown",
      label: t.kind.endsWith("payment")
        ? paymentDirection === "in"
          ? "Payment received"
          : "Payment made"
        : workLabel,
      amount: Number(t.amount),
      direction: t.kind.endsWith("payment") ? paymentDirection : "neutral",
      date: t.txn_date,
    }));

  const clientActivity = toActivity(clientTxns, clientNames, "in", "New work added");
  const labourActivity = toActivity(labourTxns, labourNames, "out", "Work entry added");
  const vendorActivity = toActivity(vendorTxns, vendorNames, "out", "New bill added");

  const monthly = buildMonthlySeries(startDate, endDate, clientWorkFy, labourWorkFy, vendorBillsFy);

  return {
    clientReceivable,
    vendorPayable,
    labourDue,
    netPosition: clientReceivable - vendorPayable - labourDue,
    totalRevenue,
    totalLabourCost,
    totalVendorCost,
    activeAccounts:
      (clients.data?.length ?? 0) + (labourers.data?.length ?? 0) + (vendors.data?.length ?? 0),
    clientActivity,
    labourActivity,
    vendorActivity,
    monthly,
  };
}

function buildMonthlySeries(
  startDate: string,
  endDate: string,
  clientWork: { amount: number; work_date: string }[],
  labourWork: { amount: number; work_date: string }[],
  vendorBills: { amount: number; bill_date: string }[]
) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const months: { key: string; month: string; revenue: number; labour: number; vendor: number }[] = [];

  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const last = new Date(end.getFullYear(), end.getMonth(), 1);

  while (cursor <= last) {
    months.push({
      key: `${cursor.getFullYear()}-${cursor.getMonth()}`,
      month: cursor.toLocaleString("en-IN", { month: "short" }),
      revenue: 0,
      labour: 0,
      vendor: 0,
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  const bucket = (dateStr: string) => {
    const d = new Date(dateStr);
    return months.find((m) => m.key === `${d.getFullYear()}-${d.getMonth()}`);
  };

  clientWork.forEach((r) => {
    const m = bucket(r.work_date);
    if (m) m.revenue += Number(r.amount);
  });
  labourWork.forEach((r) => {
    const m = bucket(r.work_date);
    if (m) m.labour += Number(r.amount);
  });
  vendorBills.forEach((r) => {
    const m = bucket(r.bill_date);
    if (m) m.vendor += Number(r.amount);
  });

  return months.map(({ month, revenue, labour, vendor }) => ({ month, revenue, labour, vendor }));
}
