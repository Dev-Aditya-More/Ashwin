"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { TriangleAlert, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export type FormActionResult = { warning?: string; id?: string } | void;

export function FormDialog({
  trigger,
  open: openProp,
  onOpenChange: onOpenChangeProp,
  title,
  description,
  action,
  submitLabel = "Save",
  children,
}: {
  trigger?: React.ReactNode;
  /** Controlled open state — omit to let the dialog manage its own (uncontrolled) state via `trigger`. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  description?: string;
  action: (formData: FormData) => Promise<FormActionResult>;
  submitLabel?: string;
  children: React.ReactNode;
}) {
  const isControlled = openProp !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isControlled ? openProp : internalOpen;
  const setOpen = isControlled ? onOpenChangeProp! : setInternalOpen;

  const [pending, startTransition] = useTransition();
  const [warning, setWarning] = useState<string | null>(null);
  const pendingFormData = useRef<FormData | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function reset() {
    setOpen(false);
    setWarning(null);
    pendingFormData.current = null;
    formRef.current?.reset();
  }

  function submit(formData: FormData) {
    startTransition(async () => {
      try {
        const result = await action(formData);
        if (result?.warning) {
          pendingFormData.current = formData;
          setWarning(result.warning);
          return;
        }
        toast.success("Saved");
        reset();
      } catch {
        toast.error("Something went wrong. Please try again.");
      }
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setWarning(null);
    submit(new FormData(e.currentTarget));
  }

  function handleConfirmAnyway() {
    const formData = pendingFormData.current;
    if (!formData) return;
    formData.set("confirm", "1");
    submit(formData);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setWarning(null);
      }}
    >
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          {children}

          {warning && (
            <div className="flex gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <TriangleAlert className="size-4 shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p>{warning}</p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={handleConfirmAnyway}
                  >
                    Add Anyway
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={pending}
                    onClick={() => setWarning(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={pending || !!warning} className="w-full sm:w-auto">
              {pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Saving…
                </>
              ) : (
                submitLabel
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
