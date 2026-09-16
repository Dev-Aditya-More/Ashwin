"use server";

import { GoogleGenAI, type Content } from "@google/genai";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  READ_TOOLS,
  WRITE_TOOLS,
  WRITE_TOOL_NAMES,
  UNDO_TOOLS,
  UNDO_TOOL_NAME,
  SYSTEM_PROMPT,
} from "@/lib/ai/tools";
import { listClients } from "@/lib/actions/clients";
import { listVendors } from "@/lib/actions/vendors";
import { listLabourers } from "@/lib/actions/labour";
import { createClientRecord, addClientWork, addClientPayment, deleteClientWork, deleteClientPayment } from "@/lib/actions/clients";
import { createVendorRecord, addVendorBill, addVendorPayment, deleteVendorBill, deleteVendorPayment } from "@/lib/actions/vendors";
import { createLabourerRecord, addLabourWork, addLabourPayment, deleteLabourWork, deleteLabourPayment } from "@/lib/actions/labour";
import { formatMoney } from "@/lib/format";

export type ChatMessage = { role: "user" | "assistant"; content: string };

export type ProposedAction = {
  tool: string;
  input: Record<string, string | number | undefined>;
  summary: string;
};

export type AssistantReply = {
  reply: string;
  proposal?: ProposedAction;
};

/** What a confirmed action would take to reverse — kept client-side so undo works across turns without server session state. */
export type UndoInfo =
  | { table: "clients" | "vendors" | "labourers"; id: string }
  | {
      table: "client_work" | "client_payments" | "vendor_bills" | "vendor_payments" | "labour_work" | "labour_payments";
      id: string;
      parentId: string;
    };

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

function client() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

async function runFindContact(input: { category: string; query: string }) {
  const query = input.query.toLowerCase();
  if (input.category === "Client") {
    const rows = await listClients();
    return rows
      .filter((c) => c.name.toLowerCase().includes(query))
      .slice(0, 5)
      .map((c) => ({ id: c.id, name: c.name, phone: c.phone, balance: c.balance }));
  }
  if (input.category === "Vendor") {
    const rows = await listVendors();
    return rows
      .filter((v) => v.name.toLowerCase().includes(query))
      .slice(0, 5)
      .map((v) => ({ id: v.id, name: v.name, phone: v.phone, balance: v.balance }));
  }
  const rows = await listLabourers();
  return rows
    .filter((l) => l.name.toLowerCase().includes(query))
    .slice(0, 5)
    .map((l) => ({ id: l.id, name: l.name, phone: l.phone, balance: l.balance }));
}

function describeAction(tool: string, input: Record<string, string | number | undefined>): string {
  const amount = typeof input.amount === "number" ? formatMoney(input.amount) : "";
  switch (tool) {
    case "create_client":
      return `Add new client "${input.name}"${input.phone ? ` (${input.phone})` : ""}`;
    case "create_vendor":
      return `Add new vendor "${input.name}"${input.category ? ` — ${input.category}` : ""}`;
    case "create_labourer":
      return `Add new worker "${input.name}"${input.default_rate ? ` at ₹${input.default_rate}/day` : ""}`;
    case "add_client_work":
      return `Log ${formatMoney(Number(input.amount))} of work for ${input.client_name}: ${input.description}`;
    case "add_client_payment":
      return `Record ${amount} payment received from ${input.client_name}`;
    case "add_vendor_bill":
      return `Log ${formatMoney(Number(input.amount))} bill from ${input.vendor_name}: ${input.description}`;
    case "add_vendor_payment":
      return `Record ${amount} payment made to ${input.vendor_name}`;
    case "add_labour_work": {
      const qty = Number(input.quantity ?? 1);
      const rate = Number(input.rate ?? 0);
      return `Log ${qty} × ₹${rate} (${formatMoney(qty * rate)}) for ${input.labourer_name}: ${input.description}`;
    }
    case "add_labour_payment":
      return `Record ${amount} ${input.entry_type === "Advance" ? "advance" : "payment"} to ${input.labourer_name}`;
    default:
      return "Proposed action";
  }
}

export async function chatWithAssistant(
  history: ChatMessage[],
  lastCommittedSummary?: string | null
): Promise<AssistantReply> {
  const gemini = client();
  if (!gemini) {
    return {
      reply: "The AI assistant isn't set up yet — add a GEMINI_API_KEY to .env.local and restart the app.",
    };
  }

  const contents: Content[] = history.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  for (let iteration = 0; iteration < 4; iteration++) {
    const response = await gemini.models.generateContent({
      model: GEMINI_MODEL,
      contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        tools: [{ functionDeclarations: [...READ_TOOLS, ...WRITE_TOOLS, ...UNDO_TOOLS] }],
      },
    });

    const call = response.functionCalls?.[0];
    const text = response.text?.trim() ?? "";

    if (!call || !call.name) {
      return { reply: text || "Okay." };
    }

    if (call.name === UNDO_TOOL_NAME) {
      if (!lastCommittedSummary) {
        return { reply: "There's nothing from this conversation to undo yet." };
      }
      return {
        reply: text,
        proposal: {
          tool: UNDO_TOOL_NAME,
          input: {},
          summary: `Undo: ${lastCommittedSummary}`,
        },
      };
    }

    if (WRITE_TOOL_NAMES.has(call.name)) {
      const input = (call.args ?? {}) as Record<string, string | number | undefined>;
      return {
        reply: text,
        proposal: { tool: call.name, input, summary: describeAction(call.name, input) },
      };
    }

    // Read-only tool (find_contact): execute it and loop back with the result.
    const result = await runFindContact(call.args as { category: string; query: string });
    const modelContent = response.candidates?.[0]?.content ?? {
      role: "model",
      parts: [{ functionCall: call }],
    };
    contents.push(modelContent);
    contents.push({
      role: "user",
      parts: [{ functionResponse: { name: call.name, response: { result } } }],
    });
  }

  return { reply: "I got a bit stuck narrowing that down — can you give me more detail?" };
}

export async function confirmAssistantAction(
  action: ProposedAction,
  confirmed = false
): Promise<{ warning?: string } | { success: true; summary: string; undo?: UndoInfo }> {
  const { tool, input } = action;
  const fd = new FormData();
  const set = (key: string, value: string | number | undefined) => {
    if (value !== undefined && value !== "") fd.set(key, String(value));
  };

  switch (tool) {
    case "create_client": {
      set("name", input.name);
      set("phone", input.phone);
      set("address", input.address);
      const { id } = await createClientRecord(fd);
      return { success: true, summary: action.summary, undo: id ? { table: "clients", id } : undefined };
    }

    case "create_vendor": {
      set("name", input.name);
      set("phone", input.phone);
      set("category", input.category);
      const { id } = await createVendorRecord(fd);
      return { success: true, summary: action.summary, undo: id ? { table: "vendors", id } : undefined };
    }

    case "create_labourer": {
      set("name", input.name);
      set("phone", input.phone);
      set("default_rate", input.default_rate);
      const { id } = await createLabourerRecord(fd);
      return { success: true, summary: action.summary, undo: id ? { table: "labourers", id } : undefined };
    }

    case "add_client_work": {
      set("description", input.description);
      set("amount", input.amount);
      set("work_date", input.work_date);
      if (confirmed) fd.set("confirm", "1");
      const clientId = String(input.client_id);
      const result = await addClientWork(clientId, fd);
      if (result?.warning) return { warning: result.warning };
      return {
        success: true,
        summary: action.summary,
        undo: result?.id ? { table: "client_work", id: result.id, parentId: clientId } : undefined,
      };
    }

    case "add_client_payment": {
      set("amount", input.amount);
      set("payment_date", input.payment_date);
      set("note", input.note);
      set("payment_mode", input.payment_mode);
      if (confirmed) fd.set("confirm", "1");
      const clientId = String(input.client_id);
      const result = await addClientPayment(clientId, fd);
      if (result?.warning) return { warning: result.warning };
      return {
        success: true,
        summary: action.summary,
        undo: result?.id ? { table: "client_payments", id: result.id, parentId: clientId } : undefined,
      };
    }

    case "add_vendor_bill": {
      set("description", input.description);
      set("amount", input.amount);
      set("bill_date", input.bill_date);
      set("bill_no", input.bill_no);
      if (confirmed) fd.set("confirm", "1");
      const vendorId = String(input.vendor_id);
      const result = await addVendorBill(vendorId, fd);
      if (result?.warning) return { warning: result.warning };
      return {
        success: true,
        summary: action.summary,
        undo: result?.id ? { table: "vendor_bills", id: result.id, parentId: vendorId } : undefined,
      };
    }

    case "add_vendor_payment": {
      set("amount", input.amount);
      set("payment_date", input.payment_date);
      set("note", input.note);
      set("payment_mode", input.payment_mode);
      if (confirmed) fd.set("confirm", "1");
      const vendorId = String(input.vendor_id);
      const result = await addVendorPayment(vendorId, fd);
      if (result?.warning) return { warning: result.warning };
      return {
        success: true,
        summary: action.summary,
        undo: result?.id ? { table: "vendor_payments", id: result.id, parentId: vendorId } : undefined,
      };
    }

    case "add_labour_work": {
      set("description", input.description);
      set("quantity", input.quantity ?? 1);
      set("rate", input.rate);
      set("work_date", input.work_date);
      if (confirmed) fd.set("confirm", "1");
      const labourerId = String(input.labourer_id);
      const result = await addLabourWork(labourerId, fd);
      if (result?.warning) return { warning: result.warning };
      return {
        success: true,
        summary: action.summary,
        undo: result?.id ? { table: "labour_work", id: result.id, parentId: labourerId } : undefined,
      };
    }

    case "add_labour_payment": {
      set("amount", input.amount);
      set("payment_date", input.payment_date);
      set("note", input.note);
      set("entry_type", input.entry_type ?? "Payment");
      if (confirmed) fd.set("confirm", "1");
      const labourerId = String(input.labourer_id);
      const result = await addLabourPayment(labourerId, fd);
      if (result?.warning) return { warning: result.warning };
      return {
        success: true,
        summary: action.summary,
        undo: result?.id ? { table: "labour_payments", id: result.id, parentId: labourerId } : undefined,
      };
    }

    default:
      return { warning: "Unknown action." };
  }
}

/**
 * Reverses whatever `confirmAssistantAction` just committed. Deletes the
 * three entity tables directly (rather than reusing deleteClientRecord/
 * deleteVendorRecord/deleteLabourerRecord) because those redirect the page
 * afterwards — fine from their own "Delete" button, but not from a chat undo.
 */
export async function undoAssistantAction(
  undo: UndoInfo
): Promise<{ success: true } | { error: string }> {
  try {
    switch (undo.table) {
      case "clients": {
        const supabase = await createClient();
        await supabase.from("clients").delete().eq("id", undo.id);
        revalidatePath("/admin/clients");
        revalidatePath("/admin");
        break;
      }
      case "vendors": {
        const supabase = await createClient();
        await supabase.from("vendors").delete().eq("id", undo.id);
        revalidatePath("/admin/vendors");
        revalidatePath("/admin");
        break;
      }
      case "labourers": {
        const supabase = await createClient();
        await supabase.from("labourers").delete().eq("id", undo.id);
        revalidatePath("/admin/labour");
        revalidatePath("/admin");
        break;
      }
      case "client_work":
        await deleteClientWork(undo.id, undo.parentId);
        break;
      case "client_payments":
        await deleteClientPayment(undo.id, undo.parentId);
        break;
      case "vendor_bills":
        await deleteVendorBill(undo.id, undo.parentId);
        break;
      case "vendor_payments":
        await deleteVendorPayment(undo.id, undo.parentId);
        break;
      case "labour_work":
        await deleteLabourWork(undo.id, undo.parentId);
        break;
      case "labour_payments":
        await deleteLabourPayment(undo.id, undo.parentId);
        break;
    }
    return { success: true };
  } catch {
    return { error: "Couldn't undo that — it may already be gone." };
  }
}
