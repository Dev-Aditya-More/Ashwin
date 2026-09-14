import { listFinancialYears, createFinancialYear, setActiveFinancialYear } from "@/lib/actions/financial-years";
import { logout } from "@/lib/actions/auth";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export default async function SettingsPage() {
  const years = await listFinancialYears();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Manage financial years and your session.
        </p>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-white p-4 space-y-4">
        <p className="font-semibold text-sm">Financial Years</p>

        <div className="divide-y divide-[var(--border)]">
          {years.map((fy) => (
            <div key={fy.id} className="flex items-center justify-between py-2.5">
              <div>
                <p className="text-sm font-medium">{fy.label}</p>
                <p className="text-xs text-[var(--text-muted)]">
                  {formatDate(fy.start_date)} – {formatDate(fy.end_date)}
                </p>
              </div>
              {fy.is_active ? (
                <Badge className="bg-blue-50 text-blue-700 border-blue-200">Active</Badge>
              ) : (
                <form action={setActiveFinancialYear.bind(null, fy.id)}>
                  <Button variant="outline" size="sm" type="submit">
                    Set Active
                  </Button>
                </form>
              )}
            </div>
          ))}
          {years.length === 0 && (
            <p className="text-sm text-[var(--text-muted)] py-4">No financial years yet.</p>
          )}
        </div>

        <form action={createFinancialYear} className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[var(--border)]">
          <div className="space-y-1.5">
            <Label htmlFor="label">Label</Label>
            <Input id="label" name="label" placeholder="FY 2027-28" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="start_date">Start Date</Label>
            <Input id="start_date" name="start_date" type="date" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="end_date">End Date</Label>
            <Input id="end_date" name="end_date" type="date" required />
          </div>
          <div className="sm:col-span-3">
            <Button type="submit" variant="outline" className="w-full sm:w-auto">
              Add Financial Year
            </Button>
          </div>
        </form>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-white p-4">
        <p className="font-semibold text-sm mb-3">Session</p>
        <form action={logout}>
          <Button type="submit" variant="destructive">
            Sign out
          </Button>
        </form>
      </div>
    </div>
  );
}
