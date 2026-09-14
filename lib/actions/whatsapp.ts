"use server";

import { listClients } from "@/lib/actions/clients";
import { listLabourers } from "@/lib/actions/labour";
import { listVendors } from "@/lib/actions/vendors";

export type WhatsappContact = {
  id: string;
  name: string;
  phone: string | null;
  balance: number;
  category: "Client" | "Labour" | "Vendor";
};

export async function listWhatsappContacts(): Promise<WhatsappContact[]> {
  const [clients, labourers, vendors] = await Promise.all([
    listClients(),
    listLabourers(),
    listVendors(),
  ]);

  return [
    ...clients.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      balance: c.balance,
      category: "Client" as const,
    })),
    ...labourers.map((l) => ({
      id: l.id,
      name: l.name,
      phone: l.phone,
      balance: l.balance,
      category: "Labour" as const,
    })),
    ...vendors.map((v) => ({
      id: v.id,
      name: v.name,
      phone: v.phone,
      balance: v.balance,
      category: "Vendor" as const,
    })),
  ];
}
