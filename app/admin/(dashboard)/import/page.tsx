import { ImportWizard } from "@/components/admin/ImportWizard";

export default function ImportPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Import</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Bring in clients, vendors, or labour from a CSV or Excel file — include an opening
          balance column to carry over existing dues.
        </p>
      </div>

      <ImportWizard />
    </div>
  );
}
