import { notFound } from "next/navigation";
import { Trash2 } from "lucide-react";
import { getLabourer, deleteLabourerRecord } from "@/lib/actions/labour";
import { listProjects } from "@/lib/actions/projects";
import {
  EditLabourerDialog,
  AddLabourWorkDialog,
  AddLabourPaymentDialog,
  EditLabourWorkDialog,
  EditLabourPaymentDialog,
} from "@/components/admin/dialogs/LabourDialogs";
import { DeleteRowButton } from "@/components/admin/dialogs/DeleteRowButton";
import { TrackVisit } from "@/components/admin/TrackVisit";
import { BackButton } from "@/components/admin/BackButton";
import { LabourLedgerTable } from "@/components/admin/EntityLedger";
import { formatDate, formatMoney } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function LabourDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let data;
  try {
    data = await getLabourer(id);
  } catch {
    notFound();
  }
  const { labourer, balance, work, payments } = data;
  if (!labourer) notFound();
  const projects = await listProjects();

  return (
    <div className="space-y-6">
      <TrackVisit id={id} name={labourer.name} category="Labour" href={`/admin/labour/${id}`} />
      <div className="flex items-center gap-2">
        <BackButton fallbackHref="/admin/labour" />
        <h1 className="text-xl font-semibold flex-1 min-w-0 truncate">{labourer.name}</h1>
        <EditLabourerDialog labourer={labourer} />
        <DeleteRowButton
          what="labourer — this also removes all their work entries and payments"
          action={deleteLabourerRecord.bind(null, id)}
          trigger={
            <Button variant="destructive" size="sm">
              <Trash2 className="size-4" />
            </Button>
          }
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <SummaryCard label="Total Work" value={balance.total_work} />
        <SummaryCard label="Total Payment Made" value={balance.total_paid} />
        <SummaryCard label="Remaining to Pay" value={balance.balance} tone="amber" />
      </div>

      {labourer.phone && <p className="text-sm text-[var(--text-muted)]">📞 {labourer.phone}</p>}

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="ledger">Ledger</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Section
              title="Work Entries"
              action={
                <AddLabourWorkDialog
                  labourerId={id}
                  projects={projects}
                  defaultRate={labourer.default_rate}
                />
              }
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Qty × Rate</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-9" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {work.map((w) => (
                    <TableRow key={w.id}>
                      <TableCell>{w.description}</TableCell>
                      <TableCell className="text-[var(--text-muted)]">
                        {w.quantity} × {formatMoney(w.rate)}
                      </TableCell>
                      <TableCell className="text-[var(--text-muted)]">{formatDate(w.work_date)}</TableCell>
                      <TableCell className="text-right font-medium">{formatMoney(w.amount)}</TableCell>
                      <TableCell>
                        <EditLabourWorkDialog work={w} labourerId={id} projects={projects} />
                      </TableCell>
                    </TableRow>
                  ))}
                  {work.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-[var(--text-muted)] py-6">
                        No work recorded yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Section>

            <Section title="Payments Made" action={<AddLabourPaymentDialog labourerId={id} />}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Note</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-9" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.note ?? "—"}</TableCell>
                      <TableCell className="text-[var(--text-muted)]">{formatDate(p.payment_date)}</TableCell>
                      <TableCell className="text-right font-medium text-rose-600">
                        - {formatMoney(p.amount)}
                      </TableCell>
                      <TableCell>
                        <EditLabourPaymentDialog payment={p} labourerId={id} />
                      </TableCell>
                    </TableRow>
                  ))}
                  {payments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-[var(--text-muted)] py-6">
                        No payments recorded yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Section>
          </div>
        </TabsContent>

        <TabsContent value="ledger">
          <LabourLedgerTable work={work} payments={payments} labourerId={id} projects={projects} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "neutral" | "amber";
}) {
  const toneClass = tone === "amber" ? "text-amber-600" : "text-[var(--text-primary)]";
  return (
    <div className="rounded-xl border border-[var(--border)] bg-white p-4">
      <p className="text-xs text-[var(--text-muted)]">{label}</p>
      <p className={`text-xl font-semibold mt-1 ${toneClass}`}>{formatMoney(value)}</p>
    </div>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <p className="font-semibold text-sm">{title}</p>
        {action}
      </div>
      {children}
    </div>
  );
}
