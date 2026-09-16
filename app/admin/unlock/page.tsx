"use client";

import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { Lock } from "lucide-react";
import { verifyPinAndUnlock } from "@/lib/actions/pin-lock";
import { Logo } from "@/components/brand/Logo";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function UnlockForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/admin";
  const [state, formAction, pending] = useActionState(verifyPinAndUnlock, { error: null });

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <input type="hidden" name="next" value={next} />
      <Input
        name="pin"
        type="password"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        autoFocus
        maxLength={8}
        placeholder="••••"
        required
        className="text-center text-lg tracking-[0.5em]"
      />

      {state.error && <p className="text-sm text-destructive text-center">{state.error}</p>}

      <Button type="submit" disabled={pending} className="w-full h-10">
        {pending ? "Checking…" : "Unlock"}
      </Button>
    </form>
  );
}

export default function UnlockPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white border border-[var(--border)] rounded-2xl shadow-sm p-8">
        <div className="flex flex-col items-center text-center mb-2">
          <Logo className="w-[170px] h-auto" />
          <div className="mt-3 size-10 rounded-full bg-[var(--accent-blue)]/10 flex items-center justify-center">
            <Lock className="size-5 text-[var(--accent-blue)]" />
          </div>
          <p className="text-sm font-medium mt-2">Enter your PIN</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            This device is locked. Enter the app PIN to continue.
          </p>
        </div>

        <Suspense fallback={null}>
          <UnlockForm />
        </Suspense>
      </div>
    </div>
  );
}
