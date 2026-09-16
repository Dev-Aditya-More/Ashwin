"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Users, Truck, HardHat, Sparkles, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormDialog } from "@/components/admin/FormDialog";
import { createClientRecord } from "@/lib/actions/clients";
import { createVendorRecord } from "@/lib/actions/vendors";
import { createLabourerRecord } from "@/lib/actions/labour";

type ActiveDialog = "client" | "vendor" | "labour" | null;

/**
 * Replaces a single "+ Add Client" shortcut with a menu covering all three
 * entity types plus a hand-off to the AI assistant — the dashboard is the
 * one place people land before knowing what they actually came to add.
 */
export function AddEntityDropdown() {
  const [active, setActive] = useState<ActiveDialog>(null);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>
            <Plus className="size-4" /> Add
            <ChevronDown className="size-3.5 opacity-70" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-56">
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setTimeout(() => setActive("client"), 0);
            }}
          >
            <Users className="size-4 text-emerald-600" /> Add Client
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setTimeout(() => setActive("vendor"), 0);
            }}
          >
            <Truck className="size-4 text-rose-600" /> Add Vendor
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setTimeout(() => setActive("labour"), 0);
            }}
          >
            <HardHat className="size-4 text-amber-600" /> Add Labour
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/admin/assistant">
              <Sparkles className="size-4 text-[var(--accent-blue)]" /> Add using AI
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <FormDialog
        open={active === "client"}
        onOpenChange={(o) => setActive(o ? "client" : null)}
        title="Add Client"
        action={createClientRecord}
        submitLabel="Add Client"
      >
        <div className="space-y-1.5">
          <Label htmlFor="dd-name">Name</Label>
          <Input id="dd-name" name="name" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dd-phone">Phone</Label>
          <Input id="dd-phone" name="phone" placeholder="10-digit mobile number" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dd-address">Address / Site</Label>
          <Input id="dd-address" name="address" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dd-opening">Opening Balance (₹, optional)</Label>
          <Input id="dd-opening" name="opening_balance" type="number" step="0.01" placeholder="e.g. 15000" />
        </div>
      </FormDialog>

      <FormDialog
        open={active === "vendor"}
        onOpenChange={(o) => setActive(o ? "vendor" : null)}
        title="Add Vendor"
        action={createVendorRecord}
        submitLabel="Add Vendor"
      >
        <div className="space-y-1.5">
          <Label htmlFor="dd-v-name">Name</Label>
          <Input id="dd-v-name" name="name" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dd-v-phone">Phone</Label>
          <Input id="dd-v-phone" name="phone" placeholder="10-digit mobile number" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dd-v-category">Category</Label>
          <Input id="dd-v-category" name="category" placeholder="e.g. Glass, Hardware, Aluminium" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dd-v-opening">Opening Balance (₹, optional)</Label>
          <Input id="dd-v-opening" name="opening_balance" type="number" step="0.01" placeholder="e.g. 8000" />
        </div>
      </FormDialog>

      <FormDialog
        open={active === "labour"}
        onOpenChange={(o) => setActive(o ? "labour" : null)}
        title="Add Labourer"
        action={createLabourerRecord}
        submitLabel="Add Labourer"
      >
        <div className="space-y-1.5">
          <Label htmlFor="dd-l-name">Name</Label>
          <Input id="dd-l-name" name="name" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dd-l-phone">Phone</Label>
          <Input id="dd-l-phone" name="phone" placeholder="10-digit mobile number" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dd-l-rate">Default Rate (₹, optional)</Label>
          <Input id="dd-l-rate" name="default_rate" type="number" min="0" step="0.01" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dd-l-opening">Opening Balance (₹, optional)</Label>
          <Input id="dd-l-opening" name="opening_balance" type="number" step="0.01" placeholder="e.g. 2000" />
        </div>
      </FormDialog>
    </>
  );
}
