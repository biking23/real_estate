import { currency, signedPct, pctChange, type CategoryRow } from "@/lib/finance";
import { cn } from "@/lib/utils";

export function ExpenseBreakdown({
  rows,
  priorLabel,
  hasPrior,
}: {
  rows: CategoryRow[];
  priorLabel: string;
  hasPrior: boolean;
}) {
  const max = Math.max(1, ...rows.map((r) => r.amount));
  const total = rows.reduce((s, r) => s + r.amount, 0);

  return (
    <section className="panel p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="display text-2xl">Expense Breakdown</h2>
        <p className="num text-xs text-muted-foreground">{currency(total)} operating expenses</p>
      </div>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          No operating expenses recorded for this selection.
        </p>
      ) : (
        <ul className="mt-5 space-y-3">
          {rows.map((r) => {
            const change = hasPrior ? pctChange(r.amount, r.priorAmount) : null;
            return (
              <li key={r.subcategory}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="text-foreground">{r.subcategory}</span>
                  <span className="flex items-baseline gap-2">
                    {change !== null && Math.abs(change) >= 0.005 && (
                      <span
                        className={cn(
                          "num text-xs",
                          change > 0 ? "text-negative" : "text-positive",
                        )}
                        title={`vs ${priorLabel}`}
                      >
                        {signedPct(change)}
                      </span>
                    )}
                    <span className="num">{currency(r.amount)}</span>
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 w-full rounded-full bg-secondary">
                  <div
                    className="h-1.5 rounded-full bg-primary"
                    style={{ width: `${(r.amount / max) * 100}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
