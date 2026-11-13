"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { GraduationCap, Loader2, SendHorizontal, ThumbsDown, ThumbsUp, Trash2 } from "@/components/icons";

import { apiRequest, readSession, writeSession, type ApiAuth } from "@/components/api";
import { Markdown } from "@/components/markdown";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SUGGESTED_QUESTIONS } from "@/lib/mentor/mentor";
import { cn } from "@/lib/utils";

// AI-01/03/07/09/10/11: chat with a mentor that knows the user's profile.
// Chats are kept in this browser tab only — the profile learns from evidence, not chat text (NFR-PR-01).

type Message = { role: "user" | "model"; text: string; mode?: string; rating?: "up" | "down" };

const KEY = "devverse.mentorChat";

export function MentorChat({ auth }: { auth: ApiAuth }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [teach, setTeach] = useState(false);
  const [busy, setBusy] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = readSession<Message[]>(KEY);
    if (saved?.length) queueMicrotask(() => setMessages(saved));
  }, []);

  useEffect(() => {
    if (!busy) writeSession(KEY, messages.length ? messages : null);
    bottom.current?.scrollIntoView({ block: "end" });
  }, [messages, busy]);

  async function send(text: string) {
    const question = text.trim();
    if (!question || busy) return;
    setError(null);
    setInput("");
    const history: Message[] = [...messages, { role: "user", text: question }];
    setMessages([...history, { role: "model", text: "" }]);
    setBusy(true);
    try {
      const res = await apiRequest("/api/mentor", auth, {
        body: { messages: history.map(({ role, text }) => ({ role, text })), teach },
      });
      if (!res.ok || !res.body) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? `Request failed (${res.status})`);
      }
      const mode = res.headers.get("X-AI-Mode") ?? "gemini";
      const left = res.headers.get("X-AI-Remaining");
      if (left !== null) setRemaining(Number(left));
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let answer = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        answer += decoder.decode(value, { stream: true });
        setMessages([...history, { role: "model", text: answer, mode }]);
      }
      if (!answer.trim()) throw new Error("The mentor returned an empty answer. Please try again.");
    } catch (e) {
      setMessages(history.slice(0, -1));
      setInput(question);
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function rate(index: number, rating: "up" | "down") {
    setMessages((m) => m.map((x, i) => (i === index ? { ...x, rating } : x)));
    apiRequest("/api/mentor/rating", auth, { body: { rating, mode: messages[index]?.mode } })
      .then((res) => {
        if (!res.ok) throw new Error();
        toast.success(rating === "up" ? "Thanks. Marked as helpful." : "Thanks. We'll use this to improve answers.");
      })
      .catch(() => toast.error("Couldn't save your rating. Try again."));
  }

  return (
    <Card className="flex min-h-[60vh] flex-col">
      <CardContent className="flex flex-1 flex-col gap-4">
        {!messages.length && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 py-8 text-center">
            <p className="max-w-md text-sm text-muted-foreground">
              Ask anything. The mentor knows your skills, struggles and GitHub history, and answers at your level.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTED_QUESTIONS.map((q) => (
                <Button key={q} variant="outline" size="sm" onClick={() => void send(q)}>
                  {q}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4" aria-live="polite">
          {messages.map((m, i) => (
            <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[85%] rounded-lg px-3 py-2",
                  m.role === "user" ? "bg-primary text-primary-foreground" : "border bg-muted/30",
                )}
              >
                {m.role === "user" ? (
                  <p className="whitespace-pre-wrap text-sm">{m.text}</p>
                ) : m.text ? (
                  <>
                    <Markdown>{m.text}</Markdown>
                    {!(busy && i === messages.length - 1) && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                        <span className="mr-auto">{m.mode === "gemini" ? "Gemini" : m.mode === "limit" ? "Daily AI limit reached" : "Offline"}</span>
                        <button
                          aria-label="Helpful"
                          className={cn("rounded p-1 hover:bg-muted", m.rating === "up" && "text-primary")}
                          onClick={() => rate(i, "up")}
                        >
                          <ThumbsUp className="size-3.5" />
                        </button>
                        <button
                          aria-label="Not helpful"
                          className={cn("rounded p-1 hover:bg-muted", m.rating === "down" && "text-destructive")}
                          onClick={() => rate(i, "down")}
                        >
                          <ThumbsDown className="size-3.5" />
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <Loader2 className="size-4 animate-spin text-muted-foreground" aria-label="Thinking" />
                )}
              </div>
            </div>
          ))}
          <div ref={bottom} />
        </div>

        {error && (
          <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <form
          className="mt-auto flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
        >
          <div className="flex gap-2">
            <textarea
              aria-label="Your question"
              className="min-h-10 flex-1 resize-none rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              rows={2}
              maxLength={4000}
              placeholder="Ask your mentor…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send(input);
                }
              }}
            />
            <Button type="submit" size="icon" className="h-auto" disabled={busy || !input.trim()} aria-label="Send">
              {busy ? <Loader2 className="animate-spin" /> : <SendHorizontal />}
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <label className="flex cursor-pointer items-center gap-1.5">
              <input type="checkbox" checked={teach} onChange={(e) => setTeach(e.target.checked)} />
              <GraduationCap className="size-3.5" /> Teach me (hints, not answers)
            </label>
            {remaining !== null && <span>{remaining} AI answers left today</span>}
            {messages.length > 0 && (
              <button type="button" className="ml-auto flex items-center gap-1 hover:text-foreground" onClick={() => setMessages([])} disabled={busy}>
                <Trash2 className="size-3.5" /> New chat
              </button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
