"use client";

import { Plus } from "lucide-react";
import { FormDialog } from "@/components/admin/FormDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createProject, updateProject } from "@/lib/actions/projects";
import type { Project } from "@/lib/types";

function StatusSelect({ defaultValue = "ongoing" }: { defaultValue?: string }) {
  return (
    <select
      id="status"
      name="status"
      defaultValue={defaultValue}
      className="w-full h-9 rounded-md border border-[var(--border)] bg-background px-3 text-sm"
    >
      <option value="ongoing">Ongoing</option>
      <option value="completed">Completed</option>
      <option value="on_hold">On Hold</option>
    </select>
  );
}

function ClientSelect({
  clients,
  defaultValue = "",
}: {
  clients: { id: string; name: string }[];
  defaultValue?: string;
}) {
  return (
    <select
      id="client_id"
      name="client_id"
      defaultValue={defaultValue}
      className="w-full h-9 rounded-md border border-[var(--border)] bg-background px-3 text-sm"
    >
      <option value="">— No client —</option>
      {clients.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  );
}

export function AddProjectDialog({ clients }: { clients: { id: string; name: string }[] }) {
  return (
    <FormDialog
      trigger={
        <Button>
          <Plus className="size-4" /> Add Project
        </Button>
      }
      title="Add Project / Site"
      action={createProject}
      submitLabel="Add Project"
    >
      <div className="space-y-1.5">
        <Label htmlFor="name">Project Name</Label>
        <Input id="name" name="name" placeholder="e.g. Patil Residence" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="client_id">Client</Label>
        <ClientSelect clients={clients} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="site_address">Site Address</Label>
        <Input id="site_address" name="site_address" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="status">Status</Label>
        <StatusSelect />
      </div>
    </FormDialog>
  );
}

export function EditProjectDialog({
  project,
  clients,
}: {
  project: Project;
  clients: { id: string; name: string }[];
}) {
  return (
    <FormDialog
      trigger={<Button variant="outline" size="sm">Edit</Button>}
      title="Edit Project"
      action={(fd) => updateProject(project.id, fd)}
    >
      <div className="space-y-1.5">
        <Label htmlFor="name">Project Name</Label>
        <Input id="name" name="name" defaultValue={project.name} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="client_id">Client</Label>
        <ClientSelect clients={clients} defaultValue={project.client_id ?? ""} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="site_address">Site Address</Label>
        <Input id="site_address" name="site_address" defaultValue={project.site_address ?? ""} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="status">Status</Label>
        <StatusSelect defaultValue={project.status} />
      </div>
    </FormDialog>
  );
}
