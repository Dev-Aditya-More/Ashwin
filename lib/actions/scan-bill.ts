"use server";

import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from "@/lib/supabase/server";
import { currentUserEmail } from "@/lib/actions/audit-helper";
import { normalizeScan, type RawScan, type ScannedBill } from "@/lib/scan-bill";
import { todayIST } from "@/lib/today";

export type ScanBillResult =
  | { ok: true; bill: ScannedBill; notes: string[] }
  | { ok: false; error: string };

const MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
const MIME_OK = ["image/jpeg", "image/png", "image/webp"];
/** Base64 characters (about 2.7 MB of image). The browser shrinks photos far below this before sending. */
const MAX_B64 = 3_700_000;

const PROMPT = `You read photos of Indian purchase bills / tax invoices that a glass & aluminium business RECEIVES from its suppliers.
Extract the details of the SUPPLIER (the seller who issued the bill), never the buyer. The buyer is ASHWIN ENTERPRISES / ARNAV GLASS SERVICES (GSTIN 27AEGPT6645A1ZF); ignore their name and GSTIN.
Rules:
- vendor_gstin: the supplier's 15-character GSTIN, exactly as printed. Omit it if the bill has none (unregistered / bill of supply).
- bill_date as YYYY-MM-DD (Indian bills are day-month-year). bill_no exactly as printed.
- taxable_amount: total taxable value before tax (after discount). cgst, sgst, igst: the tax AMOUNTS in rupees (not the percentages). Use igst only for inter-state bills.
- total_amount: the final payable grand total (after round-off).
- items: a short plain summary of what was bought (e.g. "12mm toughened glass, silicone, hardware"), max 12 words.
- Numbers are plain numbers without the rupee sign or commas. If a value is not clearly visible, OMIT it. Never guess or invent digits.`;

export async function scanBill(imageBase64: string, mimeType: string): Promise<ScanBillResult> {
  const supabase = await createClient();
  if (!(await currentUserEmail(supabase))) return { ok: false, error: "Please sign in again." };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "Bill scanning isn't set up yet. Add a GEMINI_API_KEY to .env.local and restart the app." };
  }
  if (!MIME_OK.includes(mimeType)) return { ok: false, error: "Please use a JPG, PNG or WebP photo." };
  if (!imageBase64 || imageBase64.length > MAX_B64) return { ok: false, error: "That photo is too large. Try a smaller one." };

  const number = { type: Type.NUMBER, nullable: true };
  const text = { type: Type.STRING, nullable: true };
  try {
    const ai = new GoogleGenAI({ apiKey });
    const res = await ai.models.generateContent({
      model: MODEL,
      contents: [{ role: "user", parts: [{ inlineData: { mimeType, data: imageBase64 } }, { text: PROMPT }] }],
      config: {
        temperature: 0,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            vendor_name: text,
            vendor_gstin: text,
            bill_no: text,
            bill_date: text,
            taxable_amount: number,
            cgst: number,
            sgst: number,
            igst: number,
            total_amount: number,
            items: text,
          },
        },
      },
    });
    let raw: RawScan;
    try {
      raw = JSON.parse(res.text ?? "{}") as RawScan;
    } catch {
      return { ok: false, error: "Couldn't understand the scan result. Please try again with a clearer photo." };
    }
    const { bill, notes } = normalizeScan(raw, todayIST());
    return { ok: true, bill, notes };
  } catch (e) {
    const msg = String((e as { message?: string })?.message ?? e);
    if (/RESOURCE_EXHAUSTED|"code":\s*(402|429)|credits|quota/i.test(msg)) {
      return { ok: false, error: "The AI service is out of credits or quota (Google AI Studio billing). Top it up, then try again." };
    }
    if (/API key|PERMISSION_DENIED|"code":\s*(401|403)/i.test(msg)) {
      return { ok: false, error: "The Gemini API key was rejected. Check GEMINI_API_KEY in .env.local." };
    }
    return { ok: false, error: "Scanning failed. Check your internet connection and try again." };
  }
}
