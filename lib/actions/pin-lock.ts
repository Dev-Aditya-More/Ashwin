"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { currentUserEmail } from "@/lib/actions/audit-helper";
import { PIN_COOKIE, PIN_SESSION_MS, hashPin, randomSalt, signPinToken } from "@/lib/pin-lock";

const PIN_ROW_ID = "default";

export async function getPinLockStatus(): Promise<{ enabled: boolean; secretConfigured: boolean }> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("app_lock")
    .select("pin_hash")
    .eq("id", PIN_ROW_ID)
    .maybeSingle();
  return { enabled: !!data?.pin_hash, secretConfigured: !!process.env.APP_PIN_SECRET };
}

/**
 * Sets or changes the device PIN. Changing an existing one requires the
 * current PIN (like a phone's lock-screen settings); setting the first one
 * doesn't, since reaching Settings at all already required signing in.
 * Either way, this browser is re-locked immediately so the new PIN takes
 * effect right away instead of silently trusting the old unlock.
 */
export async function setPin(
  _prevState: { error: string | null; success?: boolean },
  formData: FormData
): Promise<{ error: string | null; success?: boolean }> {
  const newPin = String(formData.get("new_pin") ?? "").trim();
  const confirmPin = String(formData.get("confirm_pin") ?? "").trim();
  const currentPin = String(formData.get("current_pin") ?? "").trim();

  if (!/^\d{4,8}$/.test(newPin)) {
    return { error: "PIN must be 4–8 digits." };
  }
  if (newPin !== confirmPin) {
    return { error: "PINs don't match." };
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("app_lock")
    .select("pin_hash, salt")
    .eq("id", PIN_ROW_ID)
    .maybeSingle();

  if (existing?.pin_hash) {
    if (!currentPin) return { error: "Enter your current PIN to change it." };
    const check = await hashPin(currentPin, existing.salt ?? "");
    if (check !== existing.pin_hash) return { error: "Current PIN is incorrect." };
  }

  const salt = randomSalt();
  const pin_hash = await hashPin(newPin, salt);
  const actorEmail = await currentUserEmail(supabase);

  const { error } = await supabase.from("app_lock").upsert({
    id: PIN_ROW_ID,
    pin_hash,
    salt,
    updated_at: new Date().toISOString(),
    updated_by: actorEmail,
  });
  if (error) return { error: "Couldn't save the PIN. Try again." };

  const jar = await cookies();
  jar.delete({ name: PIN_COOKIE, path: "/admin" });

  return { error: null, success: true };
}

export async function removePin(): Promise<void> {
  const supabase = await createClient();
  await supabase.from("app_lock").update({ pin_hash: null, salt: null }).eq("id", PIN_ROW_ID);
  const jar = await cookies();
  jar.delete({ name: PIN_COOKIE, path: "/admin" });
}

export async function verifyPinAndUnlock(
  _prevState: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const pin = String(formData.get("pin") ?? "").trim();
  const next = String(formData.get("next") ?? "") || "/admin";

  const supabase = await createClient();
  const { data } = await supabase
    .from("app_lock")
    .select("pin_hash, salt")
    .eq("id", PIN_ROW_ID)
    .maybeSingle();

  if (!data?.pin_hash) {
    // Lock isn't even on (e.g. turned off mid-session elsewhere) — let them through.
    redirect(next);
  }

  const check = await hashPin(pin, data.salt ?? "");
  if (check !== data.pin_hash) {
    return { error: "Incorrect PIN." };
  }

  const secret = process.env.APP_PIN_SECRET;
  if (!secret) {
    return { error: "App lock isn't fully configured — missing APP_PIN_SECRET." };
  }

  const token = await signPinToken(secret, Date.now() + PIN_SESSION_MS);
  const jar = await cookies();
  jar.set(PIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
    // No maxAge/expires on purpose — a session cookie the browser drops when
    // it's fully closed; the 6-hour cap is enforced inside the signed token.
  });

  redirect(next);
}
