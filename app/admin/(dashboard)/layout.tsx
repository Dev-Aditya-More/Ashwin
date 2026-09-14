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
  const [{ data }, activeFy] = await Promise.all([
    supabase.auth.getUser(),
    getActiveFinancialYear(),
  ]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar
          fyLabel={activeFy?.label ?? "No financial year set"}
          userEmail={data.user?.email ?? "Admin"}
        />
        <main className="flex-1 p-4 md:p-6 max-w-[1400px] w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
