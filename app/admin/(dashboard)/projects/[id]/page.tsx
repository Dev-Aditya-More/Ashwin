import { notFound } from "next/navigation";
import { Trash2 } from "lucide-react";
import { getProject, deleteProject, listClientsForSelect } from "@/lib/actions/projects";
import { listTransactions } from "@/lib/actions/transactions";
import { EditProjectDialog } from "@/components/admin/dialogs/ProjectDialogs";
import { TrackVisit } from "@/components/admin/TrackVisit";
import { BackButton } from "@/components/admin/BackButton";
import { formatDate, formatMoney } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STATUS_LABEL: Record<string, string> = {
  ongoing: "Ongoing",
  completed: "Completed",
  on_hold: "On Hold",
};

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let project;
  try {
    project = await getProject(id);
  } catch {
    notFound();
  }
  if (!project) notFound();

  const [clients, transactions] = await Promise.all([
    listClientsForSelect(),
    listTransactions(200, id),
  ]);

  const clientName = (project as unknown as { clients: { name: string } | null }).clients?.name;

  return (
    <div className="space-y-6">
      <TrackVisit id={id} name={project.name} category="Project" href={`/admin/projects/${id}`} />
      <div className="flex items-center gap-2">
        <BackButton fallbackHref="/admin/projects" />
        <h1 className="text-xl font-semibold flex-1 min-w-0 truncate">{project.name}</h1>
        <EditProjectDialog project={project} clients={clients} />
        <form action={deleteProject.bind(null, id)}>
          <Button variant="destructive" size="sm" type="submit">
            <Trash2 className="size-4" />
          </Button>
        </form>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--text-muted)]">
        {clientName && <span>Client: {clientName}</span>}
        {project.site_address && <span>📍 {project.site_address}</span>}
        <Badge>{STATUS_LABEL[project.status]}</Badge>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border)]">
          <p className="font-semibold text-sm">Linked Transactions</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((t) => (
              <TableRow key={t.id}>
                <TableCell>{t.category}</TableCell>
                <TableCell className="font-medium">{t.name}</TableCell>
                <TableCell className="text-[var(--text-muted)]">{t.description}</TableCell>
                <TableCell className="text-[var(--text-muted)]">{formatDate(t.date)}</TableCell>
                <TableCell
                  className={
                    "text-right font-medium " +
                    (t.direction === "in"
                      ? "text-emerald-600"
                      : t.direction === "out"
                      ? "text-rose-600"
                      : "")
                  }
                >
                  {t.direction === "in" ? "+ " : t.direction === "out" ? "- " : ""}
                  {formatMoney(t.amount)}
                </TableCell>
              </TableRow>
            ))}
            {transactions.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-[var(--text-muted)] py-10">
                  No transactions linked to this project yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
