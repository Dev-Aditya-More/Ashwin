import { KeyRound } from "lucide-react";
import { AssistantChat } from "@/components/admin/AssistantChat";

export default function AssistantPage() {
  const configured = !!process.env.GEMINI_API_KEY;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">AI Assistant</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Tell it what happened in plain English — it finds the right contact and proposes the
          ledger entry for you to confirm. Nothing is saved without your approval.
        </p>
      </div>

      {configured ? (
        <AssistantChat />
      ) : (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-white p-8 text-center space-y-3 max-w-lg mx-auto">
          <div className="size-10 rounded-full bg-[var(--accent-blue)]/10 flex items-center justify-center mx-auto">
            <KeyRound className="size-5 text-[var(--accent-blue)]" />
          </div>
          <p className="font-medium">Not set up yet</p>
          <p className="text-sm text-[var(--text-muted)]">
            Add <code className="px-1 py-0.5 rounded bg-[var(--bg-2)]">GEMINI_API_KEY</code> to
            your <code className="px-1 py-0.5 rounded bg-[var(--bg-2)]">.env.local</code> file
            (get a free key at{" "}
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              aistudio.google.com/apikey
            </a>
            ), then restart the app.
          </p>
        </div>
      )}
    </div>
  );
}
