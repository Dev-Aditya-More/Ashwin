import * as XLSX from "xlsx";
import type { ImportEntity, ImportRow } from "@/lib/actions/import";

export type ParsedSheet = {
  headers: string[];
  rows: Record<string, string>[];
};

/** Reads a .csv/.xlsx/.xls file in the browser into header + row data. */
export async function parseSpreadsheet(file: File): Promise<ParsedSheet> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

  const headers = raw.length > 0 ? Object.keys(raw[0]) : [];
  const rows = raw.map((r) =>
    Object.fromEntries(Object.entries(r).map(([k, v]) => [k, String(v).trim()]))
  );

  return { headers, rows };
}

const FIELD_ALIASES: Record<keyof Omit<ImportRow, "name">, string[]> & { name: string[] } = {
  name: ["name", "clientname", "vendorname", "labourname", "workername", "fullname", "labourer"],
  phone: ["phone", "mobile", "contact", "phonenumber", "mobileno", "contactnumber", "whatsapp"],
  address: ["address", "site", "location", "siteaddress"],
  category: ["category", "type", "vendorcategory", "trade"],
  default_rate: ["rate", "defaultrate", "dailyrate", "wage", "wageperday"],
  opening_balance: [
    "openingbalance",
    "balance",
    "due",
    "pending",
    "outstanding",
    "openingdue",
    "amountdue",
  ],
};

function normalize(header: string) {
  return header.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Auto-detects which spreadsheet column maps to which import field, by header name. */
export function detectColumnMap(headers: string[], entity: ImportEntity) {
  const relevant: (keyof typeof FIELD_ALIASES)[] =
    entity === "clients"
      ? ["name", "phone", "address", "opening_balance"]
      : entity === "vendors"
      ? ["name", "phone", "category", "opening_balance"]
      : ["name", "phone", "default_rate", "opening_balance"];

  const map: Partial<Record<keyof typeof FIELD_ALIASES, string>> = {};
  for (const field of relevant) {
    const aliases = FIELD_ALIASES[field];
    const match = headers.find((h) => aliases.includes(normalize(h)));
    if (match) map[field] = match;
  }
  return map;
}

export function rowsToImportRows(
  rows: Record<string, string>[],
  map: Partial<Record<keyof typeof FIELD_ALIASES, string>>
): ImportRow[] {
  return rows.map((r) => ({
    name: map.name ? r[map.name] ?? "" : "",
    phone: map.phone ? r[map.phone] : undefined,
    address: map.address ? r[map.address] : undefined,
    category: map.category ? r[map.category] : undefined,
    default_rate: map.default_rate && r[map.default_rate] ? Number(r[map.default_rate]) : undefined,
    opening_balance:
      map.opening_balance && r[map.opening_balance] ? Number(r[map.opening_balance]) : undefined,
  }));
}
