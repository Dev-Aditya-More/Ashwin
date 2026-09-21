"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasRecentDuplicate, duplicateWarning } from "@/lib/actions/duplicate-check";
import { currentUserEmail, insertWithActor, updateSafely } from "@/lib/actions/audit-helper";
import { applyOpeningBalance } from "@/lib/actions/import";
import { isAfterCurrentMonth, FUTURE_MONTH_WARNING } from "@/lib/date-limits";
import type { Vendor, VendorBalance, VendorBill, VendorPayment } from "@/lib/types";

export type VendorWithTotals = Vendor & { balance: number; totalBilled: number; totalPaid: number };

export async function listVendors(): Promise<VendorWithTotals[]> {
  const supabase = await createClient();
  const [{ data: vendors }, { data: balances }] = await Promise.all([
    supabase.from("vendors").select("*").order("name"),
    supabase.from("vendor_balances").select("*"),
  ]);

  const balanceMap = new Map<string, VendorBalance>(
    (balances ?? []).map((b: VendorBalance) => [b.vendor_id, b])
  );

  return (vendors ?? []).map((v) => {
    const b = balanceMap.get(v.id);
    return { ...v, balance: b?.balance ?? 0, totalBilled: b?.total_billed ?? 0, totalPaid: b?.total_paid ?? 0 };
  });
}

export async function getVendor(id: string) {
  const supabase = await createClient();
  const [{ data: vendor }, { data: balance }, { data: bills }, { data: payments }] = await Promise.all([
    supabase.from("vendors").select("*").eq("id", id).single(),
    supabase.from("vendor_balances").select("*").eq("vendor_id", id).maybeSingle(),
    supabase.from("vendor_bills").select("*").eq("vendor_id", id).order("bill_date", { ascending: false }),
    supabase
      .from("vendor_payments")
      .select("*")
      .eq("vendor_id", id)
      .order("payment_date", { ascending: false }),
  ]);

  return {
    vendor: vendor as Vendor,
    balance: (balance as VendorBalance | null) ?? {
      vendor_id: id,
      name: vendor?.name ?? "",
      total_billed: 0,
      total_paid: 0,
      balance: 0,
    },
    bills: (bills ?? []) as VendorBill[],
    payments: (payments ?? []) as VendorPayment[],
  };
}

export async function createVendorRecord(formData: FormData): Promise<{ id?: string }> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return {};
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const category = String(formData.get("category") ?? "").trim() || null;
  const opening_balance = Number(formData.get("opening_balance") ?? 0) || 0;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vendors")
    .insert({ name, phone, category })
    .select("id")
    .single();
  if (error || !data) return {};

  if (opening_balance) {
    const [fy, actorEmail] = await Promise.all([
      supabase.from("financial_years").select("id").eq("is_active", true).maybeSingle(),
      currentUserEmail(supabase),
    ]);
    await applyOpeningBalance(supabase, "vendors", data.id, opening_balance, fy.data?.id ?? null, actorEmail);
  }

  revalidatePath("/admin/vendors");
  revalidatePath("/admin");
  return { id: data.id };
}

export async function updateVendorRecord(id: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const category = String(formData.get("category") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  const supabase = await createClient();
  await supabase.from("vendors").update({ name, phone, category, notes }).eq("id", id);
  revalidatePath(`/admin/vendors/${id}`);
  revalidatePath("/admin/vendors");
}

export async function deleteVendorRecord(id: string) {
  const supabase = await createClient();
  await supabase.from("vendors").delete().eq("id", id);
  revalidatePath("/admin/vendors");
  redirect("/admin/vendors");
}

export async function addVendorBill(
  vendorId: string,
  formData: FormData
): Promise<{ warning?: string; id?: string } | void> {
  const description = String(formData.get("description") ?? "").trim() || "Bill";
  const amount = Number(formData.get("amount") ?? 0);
  const bill_date = String(formData.get("bill_date") ?? "") || new Date().toISOString().slice(0, 10);
  const bill_no = String(formData.get("bill_no") ?? "").trim() || null;
  const project_id = String(formData.get("project_id") ?? "") || null;
  const confirmed = formData.get("confirm") === "1";
  if (isAfterCurrentMonth(bill_date)) return { warning: FUTURE_MONTH_WARNING };

  const supabase = await createClient();

  if (!confirmed) {
    const isDuplicate = await hasRecentDuplicate(
      supabase,
      "vendor_bills",
      "vendor_id",
      vendorId,
      amount,
      "bill_date",
      bill_date
    );
    if (isDuplicate) return { warning: duplicateWarning(amount, bill_date) };
  }

  const [fy, actorEmail] = await Promise.all([
    supabase.from("financial_years").select("id").eq("is_active", true).maybeSingle(),
    currentUserEmail(supabase),
  ]);
  const { data } = await insertWithActor(
    supabase,
    "vendor_bills",
    {
      vendor_id: vendorId,
      project_id,
      description,
      amount,
      bill_date,
      financial_year_id: fy.data?.id ?? null,
    },
    actorEmail,
    { bill_no }
  );
  revalidatePath(`/admin/vendors/${vendorId}`);
  revalidatePath("/admin");
  return { id: data?.[0]?.id };
}

export async function updateVendorBill(id: string, vendorId: string, formData: FormData) {
  const description = String(formData.get("description") ?? "").trim() || "Bill";
  const amount = Number(formData.get("amount") ?? 0);
  const bill_date = String(formData.get("bill_date") ?? "") || new Date().toISOString().slice(0, 10);
  const bill_no = String(formData.get("bill_no") ?? "").trim() || null;
  const project_id = String(formData.get("project_id") ?? "") || null;

  const supabase = await createClient();
  await updateSafely(
    supabase,
    "vendor_bills",
    id,
    { description, amount, bill_date, project_id },
    { bill_no }
  );
  revalidatePath(`/admin/vendors/${vendorId}`);
  revalidatePath("/admin");
}

export async function updateVendorPayment(id: string, vendorId: string, formData: FormData) {
  const amount = Number(formData.get("amount") ?? 0);
  const payment_date =
    String(formData.get("payment_date") ?? "") || new Date().toISOString().slice(0, 10);
  const note = String(formData.get("note") ?? "").trim() || null;
  const payment_mode = String(formData.get("payment_mode") ?? "").trim() || null;
  if (!amount) return;

  const supabase = await createClient();
  await updateSafely(
    supabase,
    "vendor_payments",
    id,
    { amount, payment_date, note },
    { payment_mode }
  );
  revalidatePath(`/admin/vendors/${vendorId}`);
  revalidatePath("/admin");
}

export async function addVendorPayment(
  vendorId: string,
  formData: FormData
): Promise<{ warning?: string; id?: string } | void> {
  const amount = Number(formData.get("amount") ?? 0);
  const payment_date =
    String(formData.get("payment_date") ?? "") || new Date().toISOString().slice(0, 10);
  const note = String(formData.get("note") ?? "").trim() || null;
  const payment_mode = String(formData.get("payment_mode") ?? "").trim() || null;
  const confirmed = formData.get("confirm") === "1";
  if (!amount) return;
  if (isAfterCurrentMonth(payment_date)) return { warning: FUTURE_MONTH_WARNING };

  const supabase = await createClient();

  if (!confirmed) {
    const isDuplicate = await hasRecentDuplicate(
      supabase,
      "vendor_payments",
      "vendor_id",
      vendorId,
      amount,
      "payment_date",
      payment_date
    );
    if (isDuplicate) return { warning: duplicateWarning(amount, payment_date) };
  }

  const [fy, actorEmail] = await Promise.all([
    supabase.from("financial_years").select("id").eq("is_active", true).maybeSingle(),
    currentUserEmail(supabase),
  ]);
  const { data } = await insertWithActor(
    supabase,
    "vendor_payments",
    {
      vendor_id: vendorId,
      amount,
      payment_date,
      note,
      financial_year_id: fy.data?.id ?? null,
    },
    actorEmail,
    { payment_mode }
  );
  revalidatePath(`/admin/vendors/${vendorId}`);
  revalidatePath("/admin");
  return { id: data?.[0]?.id };
}

export async function deleteVendorBill(id: string, vendorId: string) {
  const supabase = await createClient();
  await supabase.from("vendor_bills").delete().eq("id", id);
  revalidatePath(`/admin/vendors/${vendorId}`);
  revalidatePath("/admin");
}

export async function deleteVendorPayment(id: string, vendorId: string) {
  const supabase = await createClient();
  await supabase.from("vendor_payments").delete().eq("id", id);
  revalidatePath(`/admin/vendors/${vendorId}`);
  revalidatePath("/admin");
}
