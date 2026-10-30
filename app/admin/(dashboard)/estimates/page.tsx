import { EstimateManager } from "@/components/admin/docs/EstimateManager";
import {
  getEstimate,
  getItemCatalog,
  getQuoteConversions,
  getNextDocNo,
  listDocClients,
  listEstimates,
  listQuotations,
} from "@/lib/actions/documents";

export default async function EstimatesPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const { edit } = await searchParams;
  const [clients, nextNo, catalog, { rows, setup }, quotes, converted, editing] = await Promise.all([
    listDocClients(),
    getNextDocNo("estimate"),
    getItemCatalog(),
    listEstimates(false),
    listQuotations(),
    getQuoteConversions(),
    edit ? getEstimate(edit) : Promise.resolve(null),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Estimate</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Glass &amp; Aluminium work is measured item by item; Civil and Interior work is charged as fees. Convert an
          estimate to a Detail Sheet to book it in the client&apos;s ledger.
        </p>
      </div>
      <EstimateManager
        // Re-mount when switching which estimate is being edited so the form starts from it.
        key={editing?.id ?? "new"}
        initialClients={clients}
        initialNo={nextNo}
        catalog={catalog}
        rows={rows}
        quotations={quotes.rows.filter((q) => !converted[q.id])}
        setup={setup}
        editing={editing}
      />
    </div>
  );
}
