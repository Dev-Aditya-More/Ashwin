import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { PIN_COOKIE, LOCK_OFF_COOKIE, verifyPinToken } from "@/lib/pin-lock";

/**
 * Guards every /admin route. Renamed from `middleware` per Next.js 16
 * (the `middleware` file convention is deprecated in favour of `proxy`).
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getClaims verifies the session JWT locally (and refreshes it when expired) — no Auth-server round trip.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims ?? null;
  const { pathname } = request.nextUrl;
  const isLoginPage = pathname === "/admin/login";
  const isUnlockPage = pathname === "/admin/unlock";

  if (!user && !isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  if (user && isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  // Second gate on top of the Supabase session: a short device PIN, so a
  // browser that already remembers the login can't be opened by whoever
  // picks up the device. Only checked on page navigations (GET) — a POST
  // here is a Server Action from a page the user already had open, and
  // redirecting those mid-flight would break the action instead of the
  // user ever seeing a lock screen.
  if (user && !isLoginPage && !isUnlockPage && request.method === "GET") {
    // "PIN lock is off" is remembered for a few minutes so ordinary navigation
    // doesn't pay a database round trip just to learn that again.
    const lockOffCached = request.cookies.get(LOCK_OFF_COOKIE)?.value === "1";
    const lock = lockOffCached
      ? null
      : (
          await supabase.from("app_lock").select("pin_hash").eq("id", "default").maybeSingle()
        ).data;

    if (!lockOffCached && !lock?.pin_hash) {
      response.cookies.set(LOCK_OFF_COOKIE, "1", { maxAge: 300, httpOnly: true, sameSite: "lax", path: "/admin" });
    }

    if (lock?.pin_hash) {
      // Fail-open if APP_PIN_SECRET isn't configured — a misconfigured env
      // var should never be able to lock everyone out of the admin panel.
      const secret = process.env.APP_PIN_SECRET;
      const token = request.cookies.get(PIN_COOKIE)?.value;
      const unlocked = secret ? await verifyPinToken(secret, token) : true;

      if (!unlocked) {
        const url = request.nextUrl.clone();
        url.pathname = "/admin/unlock";
        url.search = `?next=${encodeURIComponent(pathname + request.nextUrl.search)}`;
        return NextResponse.redirect(url);
      }
    }
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
