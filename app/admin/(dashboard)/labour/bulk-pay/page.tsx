import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { listLabourers } from "@/lib/actions/labour";
import { BulkPayForm } from "@/components/admin/BulkPayForm";

export default async function BulkPayPage() {
  const labourers = await listLabourers();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/admin/labour" className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold">Bulk Pay Labour</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Pay several workers at once — leave an amount blank to skip that worker.
          </p>
        </div>
      </div>

      <BulkPayForm labourers={labourers} />
    </div>
  );
}
