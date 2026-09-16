import type { FunctionDeclaration } from "@google/genai";

/** Read-only tools the assistant may call and see the result of immediately. */
export const READ_TOOLS: FunctionDeclaration[] = [
  {
    name: "find_contact",
    description:
      "Search existing clients, vendors, or labourers by (partial) name to find their id, phone, and current balance. Always call this before creating a new contact or logging work/payment for someone, so you reuse an existing record instead of creating a duplicate.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        category: { type: "string", enum: ["Client", "Vendor", "Labour"] },
        query: { type: "string", description: "Full or partial name to search for." },
      },
      required: ["category", "query"],
    },
  },
];

/**
 * Write tools. The assistant may call one of these, but the server NEVER
 * executes it directly — it's surfaced to the owner as a proposal card and
 * only runs after they hit Confirm (see lib/actions/assistant.ts).
 */
export const WRITE_TOOLS: FunctionDeclaration[] = [
  {
    name: "create_client",
    description: "Add a brand new client (only after find_contact confirms none already exists).",
    parametersJsonSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        phone: { type: "string" },
        address: { type: "string" },
      },
      required: ["name"],
    },
  },
  {
    name: "create_vendor",
    description: "Add a brand new vendor/supplier.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        phone: { type: "string" },
        category: { type: "string", description: "e.g. Glass, Hardware, Aluminium" },
      },
      required: ["name"],
    },
  },
  {
    name: "create_labourer",
    description: "Add a brand new worker/labourer.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        phone: { type: "string" },
        default_rate: { type: "number", description: "Their usual daily rate in rupees." },
      },
      required: ["name"],
    },
  },
  {
    name: "add_client_work",
    description: "Log billable work/an amount owed by an existing client.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        client_id: { type: "string" },
        client_name: { type: "string", description: "For display only." },
        description: { type: "string" },
        amount: { type: "number" },
        work_date: { type: "string", description: "YYYY-MM-DD, defaults to today." },
      },
      required: ["client_id", "client_name", "description", "amount"],
    },
  },
  {
    name: "add_client_payment",
    description: "Record a payment received from an existing client.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        client_id: { type: "string" },
        client_name: { type: "string", description: "For display only." },
        amount: { type: "number" },
        payment_date: { type: "string", description: "YYYY-MM-DD, defaults to today." },
        note: { type: "string" },
        payment_mode: { type: "string", enum: ["Cash", "UPI", "Bank Transfer", "Cheque", "Other"] },
      },
      required: ["client_id", "client_name", "amount"],
    },
  },
  {
    name: "add_vendor_bill",
    description: "Log a bill/amount owed to an existing vendor.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        vendor_id: { type: "string" },
        vendor_name: { type: "string", description: "For display only." },
        description: { type: "string" },
        amount: { type: "number" },
        bill_date: { type: "string", description: "YYYY-MM-DD, defaults to today." },
        bill_no: { type: "string" },
      },
      required: ["vendor_id", "vendor_name", "description", "amount"],
    },
  },
  {
    name: "add_vendor_payment",
    description: "Record a payment made to an existing vendor.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        vendor_id: { type: "string" },
        vendor_name: { type: "string", description: "For display only." },
        amount: { type: "number" },
        payment_date: { type: "string", description: "YYYY-MM-DD, defaults to today." },
        note: { type: "string" },
        payment_mode: { type: "string", enum: ["Cash", "UPI", "Bank Transfer", "Cheque", "Other"] },
      },
      required: ["vendor_id", "vendor_name", "amount"],
    },
  },
  {
    name: "add_labour_work",
    description: "Log work done by an existing worker (amount = quantity × rate).",
    parametersJsonSchema: {
      type: "object",
      properties: {
        labourer_id: { type: "string" },
        labourer_name: { type: "string", description: "For display only." },
        description: { type: "string" },
        quantity: { type: "number", description: "e.g. days worked. Defaults to 1." },
        rate: { type: "number" },
        work_date: { type: "string", description: "YYYY-MM-DD, defaults to today." },
      },
      required: ["labourer_id", "labourer_name", "description", "rate"],
    },
  },
  {
    name: "add_labour_payment",
    description: "Record a payment or advance made to an existing worker.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        labourer_id: { type: "string" },
        labourer_name: { type: "string", description: "For display only." },
        amount: { type: "number" },
        payment_date: { type: "string", description: "YYYY-MM-DD, defaults to today." },
        note: { type: "string" },
        entry_type: { type: "string", enum: ["Payment", "Advance"] },
      },
      required: ["labourer_id", "labourer_name", "amount"],
    },
  },
];

export const WRITE_TOOL_NAMES = new Set(WRITE_TOOLS.map((t) => t.name));

/** Not a database write — asks the client to redo/undo the most recently confirmed action. */
export const UNDO_TOOL_NAME = "request_undo";

export const UNDO_TOOLS: FunctionDeclaration[] = [
  {
    name: UNDO_TOOL_NAME,
    description:
      "Call this ONLY when the owner explicitly asks to undo, cancel, delete, remove, or reverse the most recently confirmed action (e.g. \"undo that\", \"remove the last entry\", \"that was a mistake, delete it\"). Never call this for anything else.",
    parametersJsonSchema: {
      type: "object",
      properties: {},
    },
  },
];

export const SYSTEM_PROMPT = `You are the office assistant for Ashwin Enterprises, an interior & architectural design and execution business. You help the owner keep their clients, vendors, and labour ledger up to date by turning short, casual messages (often typed in a hurry, sometimes in Hinglish) into the right ledger entry — through a short back-and-forth, not by guessing everything from one message.

How to gather information:
- Go field by field. Ask for whatever's missing from the tool's REQUIRED fields one or two at a time, in a natural sentence — don't dump a checklist.
- Never silently invent or assume a value for any field, required or optional. If the owner's message already gave you a value, use it — don't ask again.
- Optional fields (note, payment mode, description details, bill number, site/client name, etc.) — ask once if it seems relevant, but if the owner says "skip", "leave it", "no", "none", "doesn't matter", or just ignores the question and moves on, drop that field entirely and proceed. Do not nag about optional fields a second time.
- Required fields (per tool's "required" list, plus the resolved contact id) cannot be skipped — if the owner tries to skip one, explain briefly that it's needed and ask again.
- Only call a write tool once every required field is actually known. Calling it too early, with a guessed or placeholder value, is the single biggest mistake you can make here.

Resolving people:
- Always resolve a person via find_contact before creating or logging anything for them. If find_contact returns no good match, propose create_client/create_vendor/create_labourer first — do not guess an id.
- If find_contact returns multiple plausible matches, list them briefly and ask the owner to pick one instead of guessing.

Money direction:
- Money the OWNER RECEIVES from a client is a payment (add_client_payment). Money the owner OWES/pays to a vendor or worker is also a payment (add_vendor_payment / add_labour_payment). Work/bills owed TO the business by a client, or owed BY the business to a vendor/worker, use the *_work / *_bill tools.
- Amounts are in Indian Rupees. Interpret "5k" as 5000, "2.5 lakh" as 250000, etc.

Undo:
- If the owner asks to undo, cancel, or remove the most recently confirmed action, call ${UNDO_TOOL_NAME} — don't try to guess at reversing it yourself with another tool.

Other:
- Only ever propose one write action (or one undo) per turn. After it's confirmed or rejected, wait for the owner's next message.
- Keep replies short — one or two sentences, no preamble, no repeating back the whole form.`;
