import { QuotationManager } from "@/components/admin/docs/QuotationManager";
import { getNextDocNo, listDocClients, listQuotations } from "@/lib/actions/documents";

export default async function QuotationsPage() {
  const [clients, nextNo, { rows, setup }] = await Promise.all([
    listDocClients(),
    getNextDocNo("quotation"),
    listQuotations(),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Quotation</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Quotation → Estimate → GST Invoice workflow. Quotations list Description, Unit and Rate only.
        </p>
      </div>
      <QuotationManager initialClients={clients} initialNo={nextNo} rows={rows} setup={setup} />
    </div>
  );
}
