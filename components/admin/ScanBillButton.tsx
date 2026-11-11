"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { Camera, ImageIcon, Loader2, ScanLine, TriangleAlert, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { scanBill } from "@/lib/actions/scan-bill";
import type { ScannedBill } from "@/lib/scan-bill";

/** Longest side after shrinking. Bill text stays readable and the upload stays small on mobile data. */
const MAX_SIDE = 1800;

/** Phones and tablets (touch-first) get Take Photo + Gallery; laptops and desktops get a plain upload. */
function useIsTouchDevice() {
  return useSyncExternalStore(
    (notify) => {
      const mq = window.matchMedia("(pointer: coarse)");
      mq.addEventListener("change", notify);
      return () => mq.removeEventListener("change", notify);
    },
    () => window.matchMedia("(pointer: coarse)").matches,
    () => false
  );
}

/** Shrinks a photo to a JPEG (phone cameras make 5–12 MB files) and returns it as base64. */
async function toJpegBase64(file: File): Promise<{ data: string; mime: string }> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no canvas");
  ctx.fillStyle = "#fff"; // PNG screenshots with transparency
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const url = canvas.toDataURL("image/jpeg", 0.85);
  return { data: url.slice(url.indexOf(",") + 1), mime: "image/jpeg" };
}

/** PDFs go to the reader as they are (no shrinking). */
async function pdfToBase64(file: File): Promise<{ data: string; mime: string }> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return { data: btoa(bin), mime: "application/pdf" };
}

export function ScanBillButton({ onScanned }: { onScanned: (bill: ScannedBill, notes: string[]) => void }) {
  const touch = useIsTouchDevice();
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handle(file: File | undefined) {
    if (!file) return;
    setError(null);
    const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
    if (!isPdf && !file.type.startsWith("image/")) {
      setError("Please choose a photo or PDF (JPG, PNG, WebP or PDF).");
      return;
    }
    if (isPdf && file.size > 2.6 * 1024 * 1024) {
      setError("That PDF is too large (max about 2.5 MB). Try a smaller one.");
      return;
    }
    setBusy(true);
    try {
      let img: { data: string; mime: string };
      try {
        img = isPdf ? await pdfToBase64(file) : await toJpegBase64(file);
      } catch {
        setError("Couldn't open that file. If it's a HEIC/iPhone photo, choose it again from the gallery or take a new photo.");
        return;
      }
      const res = await scanBill(img.data, img.mime);
      if (!res.ok) setError(res.error);
      else onScanned(res.bill, res.notes);
    } catch {
      setError("Scanning failed. Check your connection and try again.");
    } finally {
      setBusy(false);
      // Allow picking the same photo again.
      if (cameraRef.current) cameraRef.current.value = "";
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--bg-2)] p-3 space-y-2">
      <div className="flex items-start gap-2">
        <ScanLine className="size-4 mt-0.5 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium leading-tight">Scan Bill</p>
          <p className="text-xs text-[var(--text-muted)]">Fills in what it can read. You can edit everything.</p>
        </div>
      </div>
      <div className={touch ? "grid grid-cols-2 gap-2" : "flex flex-wrap gap-2"}>
        {touch ? (
          <>
            <Button type="button" size="sm" variant="outline" className="w-full" disabled={busy} onClick={() => cameraRef.current?.click()}>
              <Camera className="size-4" /> Take Photo
            </Button>
            <Button type="button" size="sm" variant="outline" className="w-full" disabled={busy} onClick={() => fileRef.current?.click()}>
              <ImageIcon className="size-4" /> Gallery / PDF
            </Button>
          </>
        ) : (
          <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => fileRef.current?.click()}>
            <Upload className="size-4" /> Upload Photo / PDF
          </Button>
        )}
      </div>
      {busy && (
        <p className="flex items-center gap-1.5 text-sm text-[var(--text-muted)]">
          <Loader2 className="size-4 animate-spin" /> Reading bill…
        </p>
      )}
      {/* `capture` opens the rear camera directly on phones; the gallery input has none, so it opens the photo picker. */}
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => handle(e.target.files?.[0])} />
      <input ref={fileRef} type="file" accept="image/*,application/pdf,.pdf" hidden onChange={(e) => handle(e.target.files?.[0])} />
      {error && (
        <p className="flex gap-1.5 text-xs text-rose-700">
          <TriangleAlert className="size-3.5 shrink-0 mt-0.5" /> {error}
        </p>
      )}
    </div>
  );
}
