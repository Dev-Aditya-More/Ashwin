import type { WhatsappContact } from "@/lib/actions/whatsapp";

export function buildWhatsappMessage(contact: WhatsappContact): string {
  const amount = Math.abs(contact.balance).toLocaleString("en-IN");

  if (contact.balance <= 0) {
    return `Hi ${contact.name}, your account with Ashwin Enterprises is fully settled. Thank you!`;
  }

  if (contact.category === "Client") {
    return `Hi ${contact.name} 😊\n\nA gentle reminder regarding the ₹${amount} pending payment. Kindly arrange the payment as soon as possible.\n\nThank you for your continued support and trust. 🙏\n\nAshwin Enterprises`;
  }

  if (contact.category === "Vendor") {
    return `Hi ${contact.name},\n\nYour outstanding balance of ₹${amount} is pending with Ashwin Enterprises. We will settle the payment shortly.\n\nThank you for your continued support and cooperation. 🙏\n\nAshwin Enterprises`;
  }

  return `Hi ${contact.name},\n\nYour ₹${amount} pending payment is noted and will be paid shortly by Ashwin Enterprises.\n\nThank you for your hard work and cooperation. 🙏\nWe appreciate your support,\n\nAshwin Enterprises`;
}

export function buildWhatsappLink(phone: string, message: string): string {
  const digits = phone.replace(/[^\d]/g, "");
  const withCountryCode = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${withCountryCode}?text=${encodeURIComponent(message)}`;
}
