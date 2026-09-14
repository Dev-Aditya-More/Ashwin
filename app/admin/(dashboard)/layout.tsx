import Sidebar from "@/components/admin/Sidebar";
import Topbar from "@/components/admin/Topbar";
import { createClient } from "@/lib/supabase/server";
import { getActiveFinancialYear } from "@/lib/actions/financial-years";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  // getSession() reads the already-verified JWT from the request cookie
  // locally — no network round trip. proxy.ts already called the
  // authoritative supabase.auth.getUser() for this request (and would
  // have redirected to /admin/login if it failed), so re-verifying here
  // would just be a second, redundant call to the Supabase Auth server.
  const [{ data }, activeFy] = await Promise.all([
    supabase.auth.getSession(),
    getActiveFinancialYear(),
  ]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar
          fyLabel={activeFy?.label ?? "No financial year set"}
          userEmail={data.session?.user.email ?? "Admin"}
        />
        <main className="flex-1 p-4 md:p-6 max-w-[1400px] w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
