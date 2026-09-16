"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Send, Sparkles, CheckCircle2, X, TriangleAlert, Undo2, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  chatWithAssistant,
  confirmAssistantAction,
  undoAssistantAction,
  type ChatMessage,
  type ProposedAction,
  type UndoInfo,
} from "@/lib/actions/assistant";
import { UNDO_TOOL_NAME } from "@/lib/ai/tools";

type Turn = ChatMessage & { id: string; undoable?: UndoInfo };

const STARTERS = [
  "Rajesh paid 5000 today",
  "Add vendor Sharma Hardware",
  "Ramesh worked 2 days at 600/day",
  "Undo that",
];

export function AssistantChat() {
  const router = useRouter();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [proposal, setProposal] = useState<ProposedAction | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [confirming, startConfirming] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastCommitted = useRef<{ summary: string; undo?: UndoInfo } | null>(null);

  function scrollToEnd() {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    });
  }

  function pushTurn(role: Turn["role"], content: string, undoable?: UndoInfo) {
    setTurns((t) => [...t, { id: crypto.randomUUID(), role, content, undoable }]);
    scrollToEnd();
  }

  function send(text?: string) {
    const message = (text ?? input).trim();
    if (!message || pending) return;
    setInput("");
    setProposal(null);
    setWarning(null);
    pushTurn("user", message);

    const history: ChatMessage[] = [...turns, { role: "user" as const, content: message }].map(
      ({ role, content }) => ({ role, content })
    );

    startTransition(async () => {
      try {
        const res = await chatWithAssistant(history, lastCommitted.current?.summary ?? null);
        if (res.reply) pushTurn("assistant", res.reply);
        if (res.proposal) setProposal(res.proposal);
      } catch {
        pushTurn("assistant", "Something went wrong reaching the assistant. Please try again.");
      }
    });
  }

  function confirm(confirmedAnyway = false) {
    if (!proposal) return;

    if (proposal.tool === UNDO_TOOL_NAME) {
      const toUndo = lastCommitted.current?.undo;
      startConfirming(async () => {
        if (!toUndo) {
          pushTurn("assistant", "Nothing left to undo.");
          setProposal(null);
          return;
        }
        const result = await undoAssistantAction(toUndo);
        if ("error" in result) {
          toast.error(result.error);
        } else {
          pushTurn("assistant", "↩️ Done — that's been removed.");
          toast.success("Undone");
          lastCommitted.current = null;
          router.refresh();
        }
        setProposal(null);
        setWarning(null);
      });
      return;
    }

    startConfirming(async () => {
      const result = await confirmAssistantAction(proposal, confirmedAnyway);
      if ("warning" in result && result.warning) {
        setWarning(result.warning);
        return;
      }
      if ("success" in result) {
        lastCommitted.current = { summary: result.summary, undo: result.undo };
        pushTurn("assistant", `✅ ${result.summary}`, result.undo);
        toast.success("Saved");
        setProposal(null);
        setWarning(null);
        router.refresh();
      }
    });
  }

  function quickUndo(undo: UndoInfo, turnId: string) {
    startConfirming(async () => {
      const result = await undoAssistantAction(undo);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setTurns((t) => t.map((turn) => (turn.id === turnId ? { ...turn, undoable: undefined } : turn)));
      pushTurn("assistant", "↩️ Done — that's been removed.");
      toast.success("Undone");
      lastCommitted.current = null;
      router.refresh();
    });
  }

  function cancelProposal() {
    setProposal(null);
    setWarning(null);
    pushTurn("assistant", "Okay, I won't do that.");
  }

  const lastUndoableTurnId = [...turns].reverse().find((t) => t.undoable)?.id;

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] max-h-[720px] rounded-2xl border border-[var(--border)] bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[var(--border)] bg-gradient-to-r from-[var(--accent-blue)]/5 to-transparent">
        <div className="size-8 rounded-full bg-[var(--accent-blue)] flex items-center justify-center shrink-0">
          <Sparkles className="size-4 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-tight">Ashwin Assistant</p>
          <p className="text-xs text-[var(--text-muted)] leading-tight truncate">
            Asks before it saves anything — nothing is written without your confirm.
          </p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {turns.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center gap-4 px-6">
            <div className="size-12 rounded-full bg-[var(--accent-blue)]/10 flex items-center justify-center">
              <Sparkles className="size-6 text-[var(--accent-blue)]" />
            </div>
            <div>
              <p className="font-medium">Tell me what happened, I&apos;ll log it</p>
              <p className="text-sm text-[var(--text-muted)] mt-1 max-w-xs">
                I&apos;ll ask for anything I&apos;m missing, one thing at a time — say &ldquo;skip&rdquo;
                for anything optional you don&apos;t want to fill in.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center max-w-sm">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-xs rounded-full border border-[var(--border)] px-3 py-1.5 hover:bg-[var(--bg-2)] hover:border-[var(--accent-blue)]/40 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {turns.map((t) => (
          <div key={t.id} className={cn("flex gap-2", t.role === "user" ? "justify-end" : "justify-start")}>
            {t.role === "assistant" && (
              <div className="size-6 rounded-full bg-[var(--bg-2)] flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="size-3.5 text-[var(--text-muted)]" />
              </div>
            )}
            <div className="flex flex-col gap-1 max-w-[78%]">
              <div
                className={cn(
                  "rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap shadow-sm",
                  t.role === "user"
                    ? "bg-[var(--accent-blue)] text-white rounded-br-sm"
                    : "bg-[var(--bg-2)] text-[var(--text-primary)] rounded-bl-sm"
                )}
              >
                {t.content}
              </div>
              {t.undoable && t.id === lastUndoableTurnId && (
                <button
                  onClick={() => quickUndo(t.undoable!, t.id)}
                  disabled={confirming}
                  className="self-start flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-rose-600 transition-colors pl-1"
                >
                  <Undo2 className="size-3" /> Undo
                </button>
              )}
            </div>
            {t.role === "user" && (
              <div className="size-6 rounded-full bg-[var(--accent-blue)]/10 flex items-center justify-center shrink-0 mt-0.5">
                <User className="size-3.5 text-[var(--accent-blue)]" />
              </div>
            )}
          </div>
        ))}

        {pending && (
          <div className="flex items-center gap-2 justify-start">
            <div className="size-6 rounded-full bg-[var(--bg-2)] flex items-center justify-center shrink-0">
              <Bot className="size-3.5 text-[var(--text-muted)]" />
            </div>
            <div className="rounded-2xl rounded-bl-sm bg-[var(--bg-2)] px-3.5 py-2.5 shadow-sm">
              <span className="flex gap-1">
                <span className="size-1.5 rounded-full bg-[var(--text-muted)] animate-bounce [animation-delay:-0.3s]" />
                <span className="size-1.5 rounded-full bg-[var(--text-muted)] animate-bounce [animation-delay:-0.15s]" />
                <span className="size-1.5 rounded-full bg-[var(--text-muted)] animate-bounce" />
              </span>
            </div>
          </div>
        )}

        {proposal && (
          <div className="rounded-xl border border-[var(--accent-blue)]/30 bg-[var(--accent-blue)]/5 p-3.5 space-y-3 ml-8">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="size-4 text-[var(--accent-blue)] shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{proposal.summary}</p>
            </div>

            {warning ? (
              <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-sm text-amber-800">
                <TriangleAlert className="size-4 shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p>{warning}</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" disabled={confirming} onClick={() => confirm(true)}>
                      Add Anyway
                    </Button>
                    <Button size="sm" variant="ghost" disabled={confirming} onClick={cancelProposal}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button size="sm" disabled={confirming} onClick={() => confirm(false)}>
                  <CheckCircle2 className="size-4" /> {confirming ? "Saving…" : "Confirm"}
                </Button>
                <Button size="sm" variant="ghost" disabled={confirming} onClick={cancelProposal}>
                  <X className="size-4" /> Cancel
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex items-center gap-2 border-t border-[var(--border)] p-3 bg-[var(--bg-2)]/40"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type what happened, or 'skip' / 'undo that'…"
          disabled={pending || !!proposal}
          className="bg-white"
        />
        <Button type="submit" size="icon" disabled={pending || !!proposal || !input.trim()}>
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}
