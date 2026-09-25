import { useState, useRef } from "react";
import { Send, Sparkles, Loader2 } from "lucide-react";

const SUGGESTIONS = [
  "Why did NOI decline in August?",
  "Which property had the largest increase in operating expenses?",
  "How did August 2026 compare with August 2025?",
  "What were our largest capital expenses?",
  "How much did we spend on plumbing this year?",
  "Show me the transactions behind the increase in maintenance expenses.",
];

type Message = { role: "user" | "analyst"; text: string };

export function AnalystChat({ context }: { context: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stable UUID for the lifetime of this component mount.
  // n8n Simple Memory keys conversation history by sessionId,
  // so the same value must be sent for every turn in the session.
  const sessionId = useRef<string>(crypto.randomUUID());

  async function send(question: string) {
    const q = question.trim();
    if (!q || loading) return;

    setError(null);
    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setInput("");
    setLoading(true);

    const N8N_URL = import.meta.env.VITE_N8N_CHAT_URL as string | undefined;

    // Graceful fallback when the env var is not configured.
    if (!N8N_URL) {
      setMessages((prev) => [
        ...prev,
        {
          role: "analyst",
          text: "The AI Analyst isn't connected yet. Set VITE_N8N_CHAT_URL in .env.local to enable it.",
        },
      ]);
      setLoading(false);
      return;
    }

    try {
      // `action` is a query parameter, not a body field — required by the
      // n8n Chat Trigger to distinguish sendMessage from loadPreviousSession.
      const res = await fetch(`${N8N_URL}?action=sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatInput: q,
          sessionId: sessionId.current,
          // Pass the current dashboard filter context so n8n has it available.
          metadata: { context },
        }),
      });

      if (!res.ok) {
        throw new Error(`Analyst service responded with status ${res.status}`);
      }

      const data = await res.json();

      // AI Agent nodes return `output`; some Chain nodes return `text`.
      // Prefer `output`, fall back to `text`, then show a safe default.
      const reply =
        (data.output as string | undefined) ??
        (data.text as string | undefined) ??
        "The analyst returned an empty response.";

      setMessages((prev) => [...prev, { role: "analyst", text: reply }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(`Could not reach the analyst: ${msg}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel p-6">
      <div className="flex items-start gap-3">
        <Sparkles className="mt-1 h-5 w-5 text-primary" />
        <div>
          <h2 className="display text-2xl">Ask your portfolio analyst</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Ask questions about portfolio performance, expenses, properties, and transactions.
          </p>
        </div>
      </div>

      {messages.length > 0 && (
        <div className="mt-5 space-y-3">
          {messages.map((m, i) => (
            <div
              key={i}
              className={
                m.role === "user"
                  ? "ml-auto max-w-[85%] rounded-lg bg-primary px-4 py-2.5 text-sm text-primary-foreground"
                  : "max-w-[85%] rounded-lg bg-secondary px-4 py-2.5 text-sm text-secondary-foreground"
              }
            >
              {m.text}
            </div>
          ))}
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="mt-3 rounded-md bg-destructive/10 px-4 py-2.5 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <form
        className="mt-5 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about a property, category, or month…"
          disabled={loading}
          className="h-11 flex-1 rounded-md border border-input bg-background px-3.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {loading ? "Thinking…" : "Ask"}
        </button>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            disabled={loading}
            onClick={() => send(s)}
            className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-ring hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            {s}
          </button>
        ))}
      </div>
    </section>
  );
}
