import Link from "next/link";
import { listProjects, listClientsForSelect } from "@/lib/actions/projects";
import { AddProjectDialog } from "@/components/admin/dialogs/ProjectDialogs";
import { formatDate } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const STATUS_LABEL: Record<string, string> = {
  ongoing: "Ongoing",
  completed: "Completed",
  on_hold: "On Hold",
};

const STATUS_TONE: Record<string, string> = {
  ongoing: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  on_hold: "bg-amber-50 text-amber-700 border-amber-200",
};

export default async function ProjectsPage() {
  const [projects, clients] = await Promise.all([listProjects(), listClientsForSelect()]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Projects / Sites</h1>
          <p className="text-sm text-[var(--text-muted)]">
            {projects.length} project{projects.length === 1 ? "" : "s"}
          </p>
        </div>
        <AddProjectDialog clients={clients} />
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Site Address</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">
                  <Link href={`/admin/projects/${p.id}`} className="hover:underline">
                    {p.name}
                  </Link>
                </TableCell>
                <TableCell className="text-[var(--text-muted)]">{p.client_name ?? "—"}</TableCell>
                <TableCell className="text-[var(--text-muted)] max-w-[240px] truncate">
                  {p.site_address ?? "—"}
                </TableCell>
                <TableCell>
                  <Badge className={STATUS_TONE[p.status]}>{STATUS_LABEL[p.status]}</Badge>
                </TableCell>
                <TableCell className="text-right text-[var(--text-muted)]">
                  {formatDate(p.created_at)}
                </TableCell>
              </TableRow>
            ))}
            {projects.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-[var(--text-muted)] py-10">
                  No projects yet. Add your first project/site to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
