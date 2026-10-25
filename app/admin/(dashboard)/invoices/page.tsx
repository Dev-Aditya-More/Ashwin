import { InvoiceManager } from "@/components/admin/docs/InvoiceManager";
import { getNextDocNo, listEstimateOptions, listInvoices } from "@/lib/actions/documents";

export default async function InvoicesPage() {
  const [nextNo, estimates, { rows, setup }] = await Promise.all([
    getNextDocNo("invoice"),
    listEstimateOptions(),
    listInvoices(),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">GST &amp; Invoices</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Create a Tax Invoice from a saved estimate. This software does not file GST returns.
        </p>
      </div>
      <InvoiceManager initialNo={nextNo} estimates={estimates} rows={rows} setup={setup} />
    </div>
  );
}
