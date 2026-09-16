/**
 * Web Crypto only (no `node:crypto`) — this runs both in proxy.ts (Edge
 * runtime) and in ordinary server actions (Node), and Web Crypto's
 * `crypto.subtle` is the one hashing API both environments share.
 */

export const PIN_COOKIE = "app_pin_ok";

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/** SHA-256(salt + pin) — plenty for a short local-device PIN, not a login password. */
export async function hashPin(pin: string, salt: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(salt + pin));
  return toHex(digest);
}

export function randomSalt(): string {
  return toHex(crypto.getRandomValues(new Uint8Array(16)).buffer);
}

/** A signed "unlocked until <expiry>" cookie value — verifiable without a DB round trip. */
export async function signPinToken(secret: string, expiresAt: number): Promise<string> {
  const key = await hmacKey(secret);
  const payload = String(expiresAt);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return `${payload}.${toHex(sig)}`;
}

export async function verifyPinToken(secret: string, token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;

  const expiresAt = Number(payload);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;

  const key = await hmacKey(secret);
  const expectedSig = toHex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload)));
  // Lengths are fixed (both hex-encoded SHA-256 HMACs), so a simple
  // constant-time compare is enough without pulling in a Node-only helper.
  if (expectedSig.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < expectedSig.length; i++) diff |= expectedSig.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0;
}

/** How long an unlock lasts even if the browser tab is left open. */
export const PIN_SESSION_MS = 6 * 60 * 60 * 1000; // 6 hours
