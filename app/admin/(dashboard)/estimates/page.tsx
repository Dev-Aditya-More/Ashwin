import { EstimateManager } from "@/components/admin/docs/EstimateManager";
import {
  getItemCatalog,
  getNextDocNo,
  listDocClients,
  listEstimates,
  listQuotations,
} from "@/lib/actions/documents";

export default async function EstimatesPage() {
  const [clients, nextNo, catalog, { rows, setup }, quotes] = await Promise.all([
    listDocClients(),
    getNextDocNo("estimate"),
    getItemCatalog(),
    listEstimates(false),
    listQuotations(),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Estimate</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Measured items with half-foot rounding. Convert an estimate to a Detail Sheet to book it in the client&apos;s ledger.
        </p>
      </div>
      <EstimateManager
        initialClients={clients}
        initialNo={nextNo}
        catalog={catalog}
        rows={rows}
        quotations={quotes.rows}
        setup={setup}
      />
    </div>
  );
}
