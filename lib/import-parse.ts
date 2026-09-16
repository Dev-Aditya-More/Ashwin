import * as XLSX from "xlsx";
import type { ImportEntity, ImportRow } from "@/lib/actions/import";

export type ParsedSheet = {
  headers: string[];
  rows: Record<string, string>[];
};

export type ParsedWorkbook = {
  sheetNames: string[];
  sheets: Record<string, ParsedSheet>;
};

/**
 * Reads a .csv/.xlsx/.xlsm/.xls file in the browser into every sheet's
 * header + row data — not everyone keeps clients, vendors, and labour in
 * separate files, so a workbook with one tab per type (or one CSV with a
 * Type column) both need to be readable in one pass.
 */
export async function parseWorkbook(file: File): Promise<ParsedWorkbook> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });

  const sheets: Record<string, ParsedSheet> = {};
  for (const name of workbook.SheetNames) {
    const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[name], {
      defval: "",
    });
    const headers = raw.length > 0 ? Object.keys(raw[0]) : [];
    const rows = raw.map((r) =>
      Object.fromEntries(Object.entries(r).map(([k, v]) => [k, String(v).trim()]))
    );
    sheets[name] = { headers, rows };
  }

  return { sheetNames: workbook.SheetNames, sheets };
}

const SHEET_NAME_HINTS: Record<ImportEntity, string[]> = {
  clients: ["client", "customer"],
  vendors: ["vendor", "supplier"],
  labour: ["labour", "labor", "worker", "staff", "employee"],
};

/** Picks the best-matching sheet name for an entity tab (by name, then by containing a name-like column), falling back to the first sheet. */
export function guessSheetForEntity(workbook: ParsedWorkbook, entity: ImportEntity): string {
  const hints = SHEET_NAME_HINTS[entity];
  const byName = workbook.sheetNames.find((n) => hints.some((h) => n.toLowerCase().includes(h)));
  return byName ?? workbook.sheetNames[0];
}

const TYPE_COLUMN_ALIASES = ["type", "recordtype", "contacttype", "persontype", "entitytype", "role", "group"];

const TYPE_VALUE_HINTS: Record<ImportEntity, string[]> = {
  clients: ["client", "customer"],
  vendors: ["vendor", "supplier"],
  labour: ["labour", "labor", "worker", "staff", "employee"],
};

/** Detects a "Type"-style column that discriminates client/vendor/labour rows within one mixed sheet. */
export function detectTypeColumn(headers: string[]): string | undefined {
  return headers.find((h) => TYPE_COLUMN_ALIASES.includes(normalize(h)));
}

/** True if a mixed-sheet row's type-column value looks like it belongs to this entity. */
export function rowMatchesEntity(value: string, entity: ImportEntity): boolean {
  const v = normalize(value);
  return TYPE_VALUE_HINTS[entity].some((h) => v.includes(h));
}

const FIELD_ALIASES: Record<keyof Omit<ImportRow, "name">, string[]> & { name: string[] } = {
  name: ["name", "clientname", "vendorname", "labourname", "workername", "fullname", "labourer"],
  phone: ["phone", "mobile", "contact", "phonenumber", "mobileno", "contactnumber", "whatsapp"],
  address: ["address", "site", "location", "siteaddress"],
  category: ["category", "vendorcategory", "trade"],
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
