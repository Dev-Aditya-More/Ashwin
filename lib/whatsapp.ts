import type { WhatsappContact } from "@/lib/actions/whatsapp";

const moneyText = (n: number) =>
  Math.abs(Number(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * The WhatsApp message follows the party's most recent saved transaction:
 * payment received / paid / refund each get matching wording, otherwise the
 * outstanding (or excess) balance is mentioned. Returns null when there is
 * nothing relevant to say (settled account, no relevant transaction) — in
 * that case no message is opened, same as the original ASHWIN software.
 *
 * Civil/Interior clients sign as ASHWIN, Glass/Aluminium/UPVC clients and all
 * vendors/labour sign as ASHWIN ENTERPRISES.
 */
export function buildWhatsappMessage(contact: WhatsappContact): string | null {
  const { name, category, balance: bal, lastTxn: tx } = contact;
  const amt = moneyText(tx?.amount ?? 0);
  const ref = String(tx?.note ?? "").trim();
  const refLine = ref ? `\nReference: ${ref}` : "";
  const brand = category === "Client" ? contact.brand ?? "ASHWIN" : "ASHWIN ENTERPRISES";

  if (category === "Client") {
    if (tx?.kind === "received") {
      const status =
        bal > 0.009
          ? `\nRemaining outstanding balance: ₹${moneyText(bal)}. Please arrange payment as soon as possible.`
          : bal < -0.009
          ? `\nYour account has an excess payment of ₹${moneyText(bal)}. We will arrange the refund.`
          : "\nYour outstanding balance is now zero.";
      return `Hello ${name},\nWe have received your payment of ₹${amt}.${status}${refLine}\nThank you,\n${brand}`;
    }
    if (tx?.kind === "refund") {
      return `Hello ${name},\nA refund of ₹${amt} has been processed to you.${refLine}\nThank you,\n${brand}`;
    }
    if (bal > 0.009) {
      return `Hello ${name},\nYour outstanding balance is ₹${moneyText(bal)}. Please arrange payment as soon as possible.\nThank you,\n${brand}`;
    }
    if (bal < -0.009) {
      return `Hello ${name},\nAn excess payment of ₹${moneyText(bal)} is recorded in your account. We will arrange the refund.\nThank you,\n${brand}`;
    }
    return null;
  }

  // Vendor / Labour
  if (bal > 0.009) {
    return `Hello ${name},\nOur records show ₹${moneyText(bal)} payable to you. Please confirm the outstanding amount.\nThank you,\n${brand}`;
  }
  if (bal < -0.009) {
    return `Hello ${name},\nOur records show an excess payment of ₹${moneyText(bal)}. Please arrange a refund of this amount.\nThank you,\n${brand}`;
  }
  if (tx?.kind === "paid") {
    return `Hello ${name},\nPayment of ₹${amt} has been made to you.${refLine}\nPlease confirm receipt.\nThank you,\n${brand}`;
  }
  if (tx?.kind === "refund") {
    return `Hello ${name},\nWe have received a refund of ₹${amt} from you.${refLine}\nThank you,\n${brand}`;
  }
  return null;
}

function normaliseNumber(phone: string | null | undefined): string {
  let digits = String(phone ?? "").replace(/[^\d]/g, "");
  if (digits.length === 10) digits = `91${digits}`;
  else if (digits.length === 11 && digits.startsWith("0")) digits = `91${digits.slice(1)}`;
  return digits;
}

export function buildWhatsappLink(phone: string, message: string): string {
  return `https://wa.me/${normaliseNumber(phone)}?text=${encodeURIComponent(message)}`;
}

/** True when the number is plausible for wa.me (10–15 digits after normalising). */
export function isValidWhatsappNumber(phone: string | null | undefined): boolean {
  const n = normaliseNumber(phone);
  return n.length >= 10 && n.length <= 15;
}
