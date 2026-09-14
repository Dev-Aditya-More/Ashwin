"use client";

import { useMemo, useState } from "react";
import { MessageCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { buildWhatsappLink, buildWhatsappMessage } from "@/lib/whatsapp";
import type { WhatsappContact } from "@/lib/actions/whatsapp";

export function WhatsappComposer({
  contacts,
  compact = false,
}: {
  contacts: WhatsappContact[];
  compact?: boolean;
}) {
  const [selectedId, setSelectedId] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  const contact = useMemo(
    () => contacts.find((c) => c.id === selectedId) ?? null,
    [contacts, selectedId]
  );

  function handleSelect(id: string) {
    setSelectedId(id);
    const c = contacts.find((c) => c.id === id);
    if (c) setMessage(buildWhatsappMessage(c));
  }

  const canSend = Boolean(contact?.phone && message.trim());

  return (
    <div className={compact ? "space-y-3" : "space-y-4 max-w-md"}>
      {!compact && (
        <div className="flex items-center gap-2 text-[var(--accent-green)]">
          <MessageCircle className="size-5" />
          <p className="font-semibold text-[var(--text-primary)]">Quick WhatsApp Message</p>
        </div>
      )}

      <Select value={selectedId} onValueChange={handleSelect}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select Person" />
        </SelectTrigger>
        <SelectContent>
          {contacts.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name} · {c.category}
              {!c.phone ? " (no phone)" : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={compact ? 3 : 4}
        placeholder="Select a person to generate a message…"
      />

      <Button
        asChild={canSend}
        disabled={!canSend}
        className="w-full bg-[var(--accent-green)] hover:bg-[var(--accent-green)]/90 text-white"
      >
        {canSend ? (
          <a
            href={buildWhatsappLink(contact!.phone!, message)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle className="size-4" />
            Open in WhatsApp
          </a>
        ) : (
          <span>
            <MessageCircle className="size-4" />
            Open in WhatsApp
          </span>
        )}
      </Button>
    </div>
  );
}
