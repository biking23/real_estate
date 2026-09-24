import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { Highlight } from "@/lib/finance";
import { cn } from "@/lib/utils";

export function Highlights({ items, month }: { items: Highlight[]; month: string }) {
  return (
    <section className="panel p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="display text-2xl">Portfolio Highlights</h2>
        <p className="text-xs text-muted-foreground">
          Calculated from transaction data · {month}
        </p>
      </div>
      <ul className="mt-4 divide-y divide-border">
        {items.map((item, i) => {
          const Icon = item.tone === "up" ? ArrowUpRight : item.tone === "down" ? ArrowDownRight : Minus;
          return (
            <li key={i} className="flex gap-3 py-3 first:pt-0 last:pb-0">
              <Icon
                className={cn(
                  "mt-0.5 h-4 w-4 shrink-0",
                  item.tone === "up"
                    ? "text-positive"
                    : item.tone === "down"
                      ? "text-negative"
                      : "text-muted-foreground",
                )}
              />
              <p className="text-sm leading-relaxed text-foreground">{item.text}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
