import { listWhatsappContacts } from "@/lib/actions/whatsapp";
import { WhatsappComposer } from "@/components/admin/WhatsappComposer";
import { formatMoney } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

export default async function WhatsappPage() {
  const contacts = await listWhatsappContacts();
  const due = contacts.filter((c) => c.balance > 0 && c.phone).sort((a, b) => b.balance - a.balance);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">WhatsApp</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Generate a quick payment reminder and open it directly in WhatsApp.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-[var(--border)] bg-white p-4">
          <WhatsappComposer contacts={contacts} />
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border)]">
            <p className="font-semibold text-sm">People with an Outstanding Balance</p>
          </div>
          <div className="divide-y divide-[var(--border)] max-h-[420px] overflow-y-auto">
            {due.map((c) => (
              <div key={c.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-[var(--text-muted)]">{c.category}</p>
                </div>
                <Badge
                  className={
                    c.category === "Client"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-rose-50 text-rose-700 border-rose-200"
                  }
                >
                  {formatMoney(c.balance)}
                </Badge>
              </div>
            ))}
            {due.length === 0 && (
              <p className="px-4 py-8 text-sm text-center text-[var(--text-muted)]">
                No outstanding balances with a phone number.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
