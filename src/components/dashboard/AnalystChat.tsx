import { useState } from "react";
import { Send, Sparkles } from "lucide-react";

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

  function send(question: string) {
    const q = question.trim();
    if (!q) return;
    setMessages((prev) => [
      ...prev,
      { role: "user", text: q },
      {
        role: "analyst",
        text: `The AI Analyst isn't connected yet. Your question was captured with the current context (${context}) and will be answered once the analyst service is live.`,
      },
    ]);
    setInput("");
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
          className="h-11 flex-1 rounded-md border border-input bg-background px-3.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
        />
        <button
          type="submit"
          className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Send className="h-4 w-4" />
          Ask
        </button>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => send(s)}
            className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-ring hover:text-foreground"
          >
            {s}
          </button>
        ))}
      </div>
    </section>
  );
}
