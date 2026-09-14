import type { WhatsappContact } from "@/lib/actions/whatsapp";

export function buildWhatsappMessage(contact: WhatsappContact): string {
  const amount = Math.abs(contact.balance).toLocaleString("en-IN");

  if (contact.balance <= 0) {
    return `Hi ${contact.name}, your account with Ashwin Enterprises is fully settled. Thank you!`;
  }

  if (contact.category === "Client") {
    return `Hi ${contact.name}, your remaining balance is ₹${amount}. Please make the payment at the earliest. Thank you!`;
  }

  return `Hi ${contact.name}, your remaining payment due from Ashwin Enterprises is ₹${amount}. We will settle it soon. Thank you!`;
}

export function buildWhatsappLink(phone: string, message: string): string {
  const digits = phone.replace(/[^\d]/g, "");
  const withCountryCode = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${withCountryCode}?text=${encodeURIComponent(message)}`;
}
