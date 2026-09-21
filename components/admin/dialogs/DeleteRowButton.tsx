"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Trash2, Loader2, TriangleAlert } from "lucide-react";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

/**
 * The one delete-confirmation dialog for the whole app — a ledger row's trash
 * icon and an entity page's "Delete" button both render this, so a business
 * owner sees the exact same "are you sure" screen everywhere, not a mix of
 * instant deletes and confirmed ones.
 */
export function DeleteRowButton({
  action,
  what = "entry",
  trigger,
}: {
  action: () => Promise<void>;
  what?: string;
  /** Defaults to a small trash icon (ledger rows). Pass a bigger button for an entity page's header. */
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      try {
        await action();
        toast.success("Deleted");
        setOpen(false);
      } catch (err) {
        // A server action that redirects on success throws Next's internal
        // redirect signal — that's not a real failure, so let it propagate
        // and navigate instead of showing an error toast.
        if (err && typeof err === "object" && "digest" in err && String(err.digest).startsWith("NEXT_REDIRECT")) {
          throw err;
        }
        toast.error("Couldn't delete. Try again.");
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {trigger ?? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            title="Delete"
            className="text-[var(--text-muted)] hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-start gap-2.5">
            <div className="size-8 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
              <TriangleAlert className="size-4 text-destructive" />
            </div>
            <div className="space-y-1 pt-0.5">
              <AlertDialogTitle>Delete this {what}?</AlertDialogTitle>
              <AlertDialogDescription>
                This removes it for good — it can&apos;t be undone.
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={pending} onClick={(e) => { e.preventDefault(); handleDelete(); }}>
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Deleting…
              </>
            ) : (
              "Delete"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
