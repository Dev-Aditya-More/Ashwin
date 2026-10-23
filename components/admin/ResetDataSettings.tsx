"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, Loader2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resetAllData } from "@/lib/actions/reset-data";

export function ResetDataSettings() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();

  function reset() {
    startTransition(async () => {
      const res = await resetAllData(text);
      if (!res.ok) {
        toast.error(res.error ?? "Reset failed.");
        return;
      }
      toast.success("All data deleted. You can import a fresh file now.");
      setText("");
      router.push("/admin/import");
    });
  }

  return (
    <div className="rounded-xl border border-rose-200 bg-white p-4 space-y-3">
      <p className="font-semibold text-sm text-rose-700 flex items-center gap-2">
        <TriangleAlert className="size-4" /> Danger zone — start fresh
      </p>
      <p className="text-sm text-[var(--text-muted)]">
        Permanently deletes every client, vendor, labourer, ledger entry, project, quotation, estimate, detail sheet
        and invoice. Financial years, PIN lock and logins are kept. This cannot be undone — download a backup first.
      </p>
      <Button asChild variant="outline" size="sm">
        <a href="/admin/import/backup">
          <Download className="size-4" /> Download Full Backup JSON
        </a>
      </Button>
      <div className="flex flex-wrap gap-2 items-center">
        <Input
          className="max-w-56"
          placeholder='Type DELETE ALL'
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <Button variant="destructive" disabled={pending || text.trim() !== "DELETE ALL"} onClick={reset}>
          {pending && <Loader2 className="size-4 animate-spin" />} Delete all data
        </Button>
      </div>
    </div>
  );
}
