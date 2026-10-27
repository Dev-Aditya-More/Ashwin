// Pure helpers for Quotation / Estimate / Invoice maths. Used by the client forms
// (live totals) and re-run on the server when saving, so stored totals never
// depend on what the browser sent.

export const UNITS = ["Sq.Ft.", "Sq.Mtr.", "Rft.", "Nos.", "Job", "Set", "LS"] as const;
export const GST_RATES = [0, 5, 12, 18, 28] as const;

export const CATALOG_KEYS = ["product", "sheet", "material", "glass", "shade", "floor"] as const;
export type CatalogKey = (typeof CATALOG_KEYS)[number];
export const CATALOG_LABEL: Record<CatalogKey, string> = {
  product: "Product Type",
  sheet: "Sheet Type",
  material: "Material Type",
  glass: "Glass Type",
  shade: "Shade Type",
  floor: "Floor Type",
};

/** Civil / Interior work is charged as fees: no Transport / Hamali, and its documents print the ASHWIN civil logo. */
export const FEE_WORK_TYPES = ["Civil", "Interior", "Civil & Interior"] as const;
export const isFeeWork = (workType: unknown) => (FEE_WORK_TYPES as readonly string[]).includes(String(workType ?? ""));

/**
 * HSN / SAC code for a bill line, worked out from what the item is (a code typed on the line wins).
 *  - Civil / Interior fees → SAC 9954 (construction works) / 998391 (interior design services)
 *  - SS railing → 7308 (iron/steel structures) · ACP → 7606 (aluminium sheets)
 *  - Glass-led items (glass partition/door/railing, glazing, etching) → by glass:
 *    toughened 7007 · mirror 7009 · patterned/etched/processed 7006 · plain float 7005
 *  - Everything else (aluminium windows, doors, partitions, nets, louvers) → 7610 (aluminium structures)
 * Rates and codes must still be confirmed with the accountant.
 */
export function hsnFor(l: Pick<EstimateLine, "hsn" | "productType" | "materialType" | "glassType" | "lumpSum">): string {
  if (l.hsn?.trim()) return l.hsn.trim();
  const product = (l.productType ?? "").toLowerCase();
  const material = (l.materialType ?? "").toLowerCase();
  const glass = (l.glassType ?? "").toLowerCase();
  if (l.lumpSum) return product.includes("interior") ? "998391" : "9954";
  if (material.includes("ss railing") || (product.includes("railing") && !product.includes("glass") && material.includes("ss"))) return "7308";
  if (product.includes("acp") || glass.includes("acp")) return "7606";
  const glassLed = /glass|glazing|etching/.test(product) || material.includes("toughened glass railing");
  if (glassLed) {
    if (glass.includes("toughened") || material.includes("toughened") || product.includes("12 mm")) return "7007";
    if (glass.includes("mirror")) return "7009";
    if (product.includes("etching") || /karachi|bindiya|bajra|diomond|rubik|grill|sigma|dd |karishma|fluted/.test(glass)) return "7006";
    return "7005";
  }
  return "7610";
}

export type QuoteLine = { name: string; unit: string; rate: number };

export type EstimateLine = {
  productType: string;
  sheetType: string;
  materialType: string;
  glassType: string;
  shadeType: string;
  floorType: string;
  heightIn: number;
  lengthIn: number;
  heightFt: number;
  lengthFt: number;
  qty: number;
  unit: string;
  sqft: number;
  rate: number;
  amount: number;
  hsn?: string;
  /** Measurement exactly as typed (e.g. "45 3/8") — what every document prints. */
  heightText?: string;
  lengthText?: string;
  lumpSum?: boolean;
  /** Optional remark for a Glass & Aluminium item (e.g. "with mosquito net"); printed under its description. */
  note?: string;
};

/** Raw line as typed in the form (dimensions are free text such as "45 1/8"). */
export type EstimateLineInput = {
  productType: string;
  sheetType: string;
  materialType: string;
  glassType: string;
  shadeType: string;
  floorType: string;
  height: string;
  length: string;
  qty: number;
  unit: string;
  rate: number;
  /** A fee charged as one amount (Civil / Interior Fees): no measurements, amount = rate × qty. */
  lumpSum?: boolean;
  /** Optional remark for this item. */
  note?: string;
};

/**
 * "45.375", "45 3/8", "45-3/8", "45+3/8", "45½", "3/8", "45 1" (= 45 + 1/8, i.e. eighths), "45 1 soot".
 * Returns 0 when it can't be understood.
 */
const UNICODE_FRACTIONS: Record<string, string> = {
  "½": " 1/2", "⅓": " 1/3", "⅔": " 2/3", "¼": " 1/4", "¾": " 3/4", "⅛": " 1/8", "⅜": " 3/8", "⅝": " 5/8", "⅞": " 7/8",
};

export function parseInches(value: unknown): number {
  const s = String(value ?? "")
    .replace(/[½⅓⅔¼¾⅛⅜⅝⅞]/g, (c) => UNICODE_FRACTIONS[c])
    .replace(/⁄/g, "/")
    .replace(/\+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/″|"|inch|inches/g, "")
    .replace(/soot|सूतो?|सू्त/g, " soot ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!s) return 0;
  let m = s.match(/^(-?\d+(?:\.\d+)?)\s+(\d+)\s*\/\s*(\d+)$/);
  if (m) return Number(m[1]) + Number(m[2]) / Number(m[3]);
  m = s.match(/^(-?\d+(?:\.\d+)?)\s+(\d+)\s*soot$/);
  if (m) return Number(m[1]) + Number(m[2]) / 8;
  m = s.match(/^(-?\d+(?:\.\d+)?)\s+(\d+)$/);
  if (m) return Number(m[1]) + Number(m[2]) / 8;
  const f = s.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (f) return Number(f[1]) / Number(f[2]);
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

/** Inches → feet, each dimension rounded UP to the next half-foot (62.25″ → 5.5, 68.5″ → 6). */
export function halfFoot(inches: unknown): number {
  const n = parseInches(inches);
  return Math.ceil((n - 1e-9) / 6) / 2 || 0;
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);

export function calcEstimateLine(l: EstimateLineInput): EstimateLine {
  const qty = Math.max(0, num(l.qty));
  const rate = Math.max(0, num(l.rate));
  if (l.lumpSum) {
    return {
      productType: l.productType ?? "", sheetType: "", materialType: "", glassType: "", shadeType: "", floorType: "",
      heightIn: 0, lengthIn: 0, heightText: "", lengthText: "", heightFt: 0, lengthFt: 0,
      qty: qty || 1, unit: l.unit || "LS", sqft: 0, rate, amount: rate * (qty || 1), lumpSum: true,
    };
  }
  const h = halfFoot(l.height);
  const len = halfFoot(l.length);
  const sqft = h * len * qty;
  const note = String(l.note ?? "").trim().replace(/\s+/g, " ");
  return {
    ...(note ? { note } : {}),
    productType: l.productType ?? "",
    sheetType: l.sheetType ?? "",
    materialType: l.materialType ?? "",
    glassType: l.glassType ?? "",
    shadeType: l.shadeType ?? "",
    floorType: l.floorType ?? "",
    heightIn: parseInches(l.height),
    lengthIn: parseInches(l.length),
    heightText: String(l.height ?? "").trim(),
    lengthText: String(l.length ?? "").trim(),
    heightFt: h,
    lengthFt: len,
    qty,
    unit: l.unit || "Sq.Ft.",
    sqft,
    rate,
    amount: sqft * rate,
  };
}

export type EstimateTotals = {
  lines: EstimateLine[];
  subtotal: number;
  discountPct: number;
  discount: number;
  afterDiscount: number;
  transport: number;
  hamali: number;
  taxable: number;
  gstRate: number;
  tax: number;
  total: number;
};

export function calcEstimate(
  inputs: EstimateLineInput[],
  opts: { discountPct?: number; transport?: number; hamali?: number; gstRate?: number }
): EstimateTotals {
  const lines = inputs.map(calcEstimateLine);
  const subtotal = lines.reduce((a, l) => a + l.amount, 0);
  const discountPct = Math.min(100, Math.max(0, num(opts.discountPct)));
  const discount = (subtotal * discountPct) / 100;
  const afterDiscount = Math.max(0, subtotal - discount);
  const transport = Math.max(0, num(opts.transport));
  const hamali = Math.max(0, num(opts.hamali));
  const taxable = afterDiscount + transport + hamali;
  const gstRate = Math.max(0, num(opts.gstRate));
  const tax = (taxable * gstRate) / 100;
  return {
    lines,
    subtotal: round2(subtotal),
    discountPct,
    discount: round2(discount),
    afterDiscount: round2(afterDiscount),
    transport,
    hamali,
    taxable: round2(taxable),
    gstRate,
    tax: round2(tax),
    total: round2(taxable + tax),
  };
}

export const GSTIN_RE = /^[0-9A-Z]{15}$/;

/** Indian-rupees-in-words for the tax invoice. */
export function amountInWords(n: number): string {
  if (!n) return "Zero Rupees only";
  let x = Math.round(n);
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const under = (v: number) => (v < 20 ? ones[v] : tens[Math.floor(v / 10)] + (v % 10 ? " " + ones[v % 10] : ""));
  const part = (v: number) => {
    const out: string[] = [];
    if (v >= 100) {
      out.push(ones[Math.floor(v / 100)] + " Hundred");
      v %= 100;
    }
    if (v) out.push(under(v));
    return out.join(" ");
  };
  const out: string[] = [];
  const cr = Math.floor(x / 10000000);
  x %= 10000000;
  const lk = Math.floor(x / 100000);
  x %= 100000;
  if (cr) out.push(part(cr) + " Crore");
  if (lk) out.push(part(lk) + " Lakh");
  const th = Math.floor(x / 1000);
  x %= 1000;
  if (th) out.push(part(th) + " Thousand");
  if (x) out.push(part(x));
  return out.join(" ") + " Rupees only";
}

/** Short read-back of what a typed measurement was understood as, e.g. "45 3/8" → "45.375″ → 4 ft". */
export function describeInches(value: unknown): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const n = parseInches(raw);
  if (!n) return "Not understood — use e.g. 45 3/8";
  return `${inchesToFraction(n)}″ → ${halfFoot(raw)} ft`;
}

/** 45.375 → "45 3/8", 0.5 → "1/2", 45 → "45" (nearest 1/16 inch). */
export function inchesToFraction(n: number): string {
  if (!Number.isFinite(n)) return "";
  const sixteenths = Math.round(Math.abs(n) * 16);
  const whole = Math.floor(sixteenths / 16);
  let num = sixteenths % 16;
  let den = 16;
  while (num && num % 2 === 0) {
    num /= 2;
    den /= 2;
  }
  const sign = n < 0 ? "-" : "";
  if (!num) return `${sign}${whole}`;
  return whole ? `${sign}${whole} ${num}/${den}` : `${sign}${num}/${den}`;
}

/** One dimension as the user wrote it; older saved lines (numbers only) are shown as fractions, never decimals. */
function dimAsWritten(text: string | undefined, inches: number | undefined): string {
  const t = String(text ?? "").trim().replace(/\s+/g, " ").replace(/[″"]+$/, "").trim();
  if (t) return t;
  return inches != null && Number(inches) ? inchesToFraction(Number(inches)) : "";
}

/** Size column for documents: `45 3/8″ × 62½″` exactly as typed — no conversion to decimals or feet. */
export function sizeAsWritten(l: Pick<EstimateLine, "heightText" | "lengthText" | "heightIn" | "lengthIn">): string {
  const h = dimAsWritten(l.heightText, l.heightIn);
  const w = dimAsWritten(l.lengthText, l.lengthIn);
  if (!h && !w) return "";
  return `${h || "—"}″ × ${w || "—"}″`;
}

/** Same product, finish, size and rate → the same line (sizes compared by value, so 45 3/8 = 45.375). */
export function sameItemKey(l: EstimateLineInput): string {
  const dim = (v: string) => (String(v ?? "").trim() ? String(parseInches(v)) : "");
  return [
    l.lumpSum ? "fee" : "item",
    l.productType, l.materialType, l.glassType, l.shadeType, l.floorType,
    dim(l.height), dim(l.length), l.unit, Number(l.rate) || 0, String(l.note ?? "").trim(),
  ].join("|").toLowerCase();
}

/** Identical items are one line with a bigger Qty instead of repeated rows. */
export function mergeSameLines(lines: EstimateLineInput[]): EstimateLineInput[] {
  const out: EstimateLineInput[] = [];
  const at = new Map<string, number>();
  for (const l of lines) {
    const k = sameItemKey(l);
    const i = at.get(k);
    if (i === undefined) {
      at.set(k, out.length);
      out.push({ ...l });
    } else {
      out[i] = { ...out[i], qty: (Number(out[i].qty) || 0) + (Number(l.qty) || 0) };
    }
  }
  return out;
}

/** A saved line back into what the form edits (sizes as they were typed). */
export function lineToInput(l: EstimateLine): EstimateLineInput {
  return {
    productType: l.productType ?? "",
    sheetType: l.sheetType ?? "",
    materialType: l.materialType ?? "",
    glassType: l.glassType ?? "",
    shadeType: l.shadeType ?? "",
    floorType: l.floorType ?? "",
    height: l.lumpSum ? "" : l.heightText || (l.heightIn ? inchesToFraction(l.heightIn) : ""),
    length: l.lumpSum ? "" : l.lengthText || (l.lengthIn ? inchesToFraction(l.lengthIn) : ""),
    qty: Number(l.qty) || 1,
    unit: l.unit || "Sq.Ft.",
    rate: Number(l.rate) || 0,
    lumpSum: l.lumpSum,
    note: l.note ?? "",
  };
}

/** A printed row: one or more saved lines that come out the same once sizes are rounded to feet. */
export type PrintLine = EstimateLine & {
  /** Each exact measurement folded into this row, as typed, with how many of that size. */
  sizes: { text: string; qty: number }[];
};

/**
 * Lines with the same product, finish, rate and size in rounded feet print as ONE row with the Qty,
 * Sq.Ft. and Amount added up (e.g. 45 1/8″ × 47 2/8″ and 46 3/8″ × 43 5/8″ are both 4′ × 4′).
 * The exact inch sizes are kept in `sizes` so the Detail Sheet can still show every measurement.
 */
export function mergeForPrint(lines: EstimateLine[]): PrintLine[] {
  const out: PrintLine[] = [];
  const at = new Map<string, number>();
  for (const l of lines) {
    const text = sizeAsWritten(l);
    const k = [
      l.lumpSum ? "fee" : "item",
      l.productType, l.materialType, l.glassType, l.shadeType, l.floorType,
      l.heightFt, l.lengthFt, l.unit, Number(l.rate) || 0, l.hsn ?? "", l.note ?? "",
    ].join("|").toLowerCase();
    const i = at.get(k);
    if (i === undefined || l.lumpSum) {
      at.set(k, out.length);
      out.push({ ...l, sizes: text ? [{ text, qty: Number(l.qty) || 0 }] : [] });
      continue;
    }
    const row = out[i];
    row.qty = (Number(row.qty) || 0) + (Number(l.qty) || 0);
    row.sqft = Math.round(((Number(row.sqft) || 0) + (Number(l.sqft) || 0)) * 100) / 100;
    row.amount = Math.round(((Number(row.amount) || 0) + (Number(l.amount) || 0)) * 100) / 100;
    const same = row.sizes.find((s) => s.text === text);
    if (same) same.qty += Number(l.qty) || 0;
    else if (text) row.sizes.push({ text, qty: Number(l.qty) || 0 });
  }
  return out;
}

/** Size in rounded feet for estimates and bills, e.g. `4′ × 5.5′` (fee lines have none). */
export function sizeInFeet(l: Pick<EstimateLine, "heightFt" | "lengthFt" | "lumpSum">): string {
  if (l.lumpSum || !l.heightFt || !l.lengthFt) return "";
  return `${Number(l.heightFt)}′ × ${Number(l.lengthFt)}′`;
}
