import { useState, useRef } from "react";
import { Send, Sparkles, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

// Tailwind preflight resets headings, lists, and tables to unstyled defaults.
// These renderers restore readable presentation scoped to analyst bubbles only.
const MARKDOWN_COMPONENTS: Components = {
  // Paragraphs ----------------------------------------------------------------
  p: ({ children }) => (
    <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>
  ),
  // Headings ------------------------------------------------------------------
  h1: ({ children }) => (
    <h1 className="mt-5 mb-2 text-base font-bold leading-snug first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-4 mb-2 text-sm font-bold leading-snug first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-3 mb-1 text-sm font-semibold leading-snug first:mt-0">
      {children}
    </h3>
  ),
  // Lists ---------------------------------------------------------------------
  ul: ({ children }) => (
    <ul className="mb-3 list-disc pl-5 space-y-1 last:mb-0">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-3 list-decimal pl-5 space-y-1 last:mb-0">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="leading-relaxed">{children}</li>
  ),
  // Inline --------------------------------------------------------------------
  strong: ({ children }) => (
    <strong className="font-semibold">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  code: ({ children }) => (
    <code className="rounded bg-black/10 px-1 py-0.5 font-mono text-xs dark:bg-white/10">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="mb-3 overflow-x-auto rounded bg-black/10 p-3 font-mono text-xs leading-relaxed dark:bg-white/10 last:mb-0">
      {children}
    </pre>
  ),
  // Tables — wrapped in a scrollable container for narrow screens ------------
  table: ({ children }) => (
    <div className="mb-3 overflow-x-auto rounded last:mb-0" role="region" aria-label="Data table">
      <table className="w-full border-collapse text-xs">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="border-b border-secondary-foreground/20 bg-black/5 dark:bg-white/5">
      {children}
    </thead>
  ),
  tbody: ({ children }) => <tbody className="divide-y divide-secondary-foreground/10">{children}</tbody>,
  tr: ({ children }) => <tr>{children}</tr>,
  th: ({ children }) => (
    <th
      scope="col"
      className="px-3 py-2 text-left font-semibold text-secondary-foreground"
    >
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-3 py-2 text-secondary-foreground">{children}</td>
  ),
};

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
                  : "max-w-[85%] rounded-lg bg-secondary px-4 py-2.5 text-sm text-secondary-foreground prose prose-sm dark:prose-invert max-w-none"
              }
            >
              {m.role === "analyst" ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={MARKDOWN_COMPONENTS}
                >
                  {m.text}
                </ReactMarkdown>
              ) : (
                m.text
              )}
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
