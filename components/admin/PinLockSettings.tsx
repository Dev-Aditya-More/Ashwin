"use client";

import { useActionState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ShieldCheck, TriangleAlert } from "lucide-react";
import { setPin, removePin } from "@/lib/actions/pin-lock";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function PinLockSettings({
  enabled,
  secretConfigured,
}: {
  enabled: boolean;
  secretConfigured: boolean;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(setPin, { error: null });
  const [removing, startRemoving] = useTransition();

  useEffect(() => {
    if (state.success) {
      toast.success(enabled ? "PIN changed" : "PIN set");
      router.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  function handleRemove() {
    startRemoving(async () => {
      await removePin();
      toast.success("PIN lock turned off");
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-white p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-[var(--accent-blue)]" />
          <p className="font-semibold text-sm">App Lock PIN</p>
        </div>
        {enabled && (
          <Button type="button" variant="ghost" size="sm" disabled={removing} onClick={handleRemove}>
            {removing ? "Turning off…" : "Turn off"}
          </Button>
        )}
      </div>
      <p className="text-xs text-[var(--text-muted)] -mt-2">
        {enabled
          ? "A PIN is required on this and every device before the dashboard opens — separate from your sign-in password, so a browser that already remembers your login still can't be opened by anyone else."
          : "Not set up. Add a PIN so the dashboard stays locked even on a device that already remembers your sign-in."}
      </p>

      {enabled && !secretConfigured && (
        <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-sm text-amber-800">
          <TriangleAlert className="size-4 shrink-0 mt-0.5" />
          <p>
            A PIN is set, but the server can&apos;t see <code>APP_PIN_SECRET</code> right now, so
            the lock screen won&apos;t appear. This env var needs a full server restart (redeploy,
            or stop/start <code>npm run dev</code>) to take effect — just editing{" "}
            <code>.env.local</code> isn&apos;t enough while it&apos;s already running.
          </p>
        </div>
      )}

      <form action={formAction} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {enabled && (
          <div className="space-y-1.5">
            <Label htmlFor="current_pin">Current PIN</Label>
            <Input id="current_pin" name="current_pin" type="password" inputMode="numeric" maxLength={8} />
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="new_pin">{enabled ? "New PIN" : "PIN"}</Label>
          <Input
            id="new_pin"
            name="new_pin"
            type="password"
            inputMode="numeric"
            maxLength={8}
            placeholder="4–8 digits"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm_pin">Confirm PIN</Label>
          <Input id="confirm_pin" name="confirm_pin" type="password" inputMode="numeric" maxLength={8} required />
        </div>

        {state.error && <p className="sm:col-span-3 text-sm text-destructive">{state.error}</p>}

        <div className="sm:col-span-3">
          <Button type="submit" variant="outline" disabled={pending} className="w-full sm:w-auto">
            {pending ? "Saving…" : enabled ? "Change PIN" : "Set PIN"}
          </Button>
        </div>
      </form>
    </div>
  );
}
