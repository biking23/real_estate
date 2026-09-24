import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { transactionsQuery } from "@/lib/transactions";
import {
  allMonths,
  buildHighlights,
  expenseBreakdown,
  inMonth,
  monthLabel,
  monthlySeries,
  priorYearKey,
  propertyBreakdown,
  properties,
  totals,
} from "@/lib/finance";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { Highlights } from "@/components/dashboard/Highlights";
import { TrendChart } from "@/components/dashboard/TrendChart";
import { PropertyPerformance } from "@/components/dashboard/PropertyPerformance";
import { ExpenseBreakdown } from "@/components/dashboard/ExpenseBreakdown";
import { TransactionExplorer } from "@/components/dashboard/TransactionExplorer";
import { AnalystChat } from "@/components/dashboard/AnalystChat";

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(transactionsQuery),
  head: () => ({
    meta: [
      { title: "Portfolio Analyst — Monthly Financial Review" },
      {
        name: "description",
        content:
          "Revenue, operating expenses, NOI and transaction detail for your real-estate portfolio, reviewed month by month.",
      },
      { property: "og:title", content: "Portfolio Analyst — Monthly Financial Review" },
      {
        property: "og:description",
        content:
          "Revenue, operating expenses, NOI and transaction detail for your real-estate portfolio, reviewed month by month.",
      },
    ],
  }),
  component: Dashboard,
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-lg px-6 py-24 text-center" role="alert">
      <h1 className="display text-3xl">Financial data unavailable</h1>
      <p className="mt-3 text-sm text-muted-foreground">{error.message}</p>
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-lg px-6 py-24 text-center">
      <h1 className="display text-3xl">No transactions found</h1>
    </div>
  ),
});

function Dashboard() {
  const { data: rows } = useSuspenseQuery(transactionsQuery);
  const months = useMemo(() => allMonths(rows), [rows]);
  const latest = months[months.length - 1] ?? "";
  const [month, setMonth] = useState(latest);
  const [property, setProperty] = useState<string | "all">("all");

  const scoped = useMemo(
    () => (property === "all" ? rows : rows.filter((r) => r.property_name === property)),
    [rows, property],
  );

  const priorKey = priorYearKey(month);
  const currentRows = useMemo(() => inMonth(scoped, month), [scoped, month]);
  const priorRows = useMemo(() => inMonth(scoped, priorKey), [scoped, priorKey]);
  const current = useMemo(() => totals(currentRows), [currentRows]);
  const prior = priorRows.length > 0 ? totals(priorRows) : null;
  const highlights = useMemo(() => buildHighlights(scoped, month), [scoped, month]);
  const series = useMemo(() => monthlySeries(scoped), [scoped]);
  const propRows = useMemo(() => propertyBreakdown(inMonth(rows, month)), [rows, month]);
  const categories = useMemo(() => expenseBreakdown(currentRows, priorRows), [currentRows, priorRows]);
  const propertyNames = useMemo(() => properties(rows), [rows]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-end justify-between gap-6 px-6 py-7">
          <div>
            <p className="label-caps">Portfolio Analyst</p>
            <h1 className="display mt-1 text-4xl leading-tight">
              {property === "all" ? "Portfolio review" : property}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {monthLabel(month)} · compared with {monthLabel(priorKey)}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <label className="flex flex-col gap-1">
              <span className="label-caps">Reporting month</span>
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="h-10 rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {[...months].reverse().map((m) => (
                  <option key={m} value={m}>
                    {monthLabel(m)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="label-caps">Scope</span>
              <select
                value={property}
                onChange={(e) => setProperty(e.target.value)}
                className="h-10 rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="all">All properties</option>
                {propertyNames.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] space-y-6 px-6 py-8">
        <KpiCards current={current} prior={prior} priorLabel={monthLabel(priorKey)} />
        <Highlights items={highlights} month={monthLabel(month)} />
        <TrendChart data={series} selectedMonth={month} />
        <div className="grid gap-6 lg:grid-cols-2">
          <PropertyPerformance rows={propRows} selected={property} onSelect={setProperty} />
          <ExpenseBreakdown
            rows={categories}
            priorLabel={monthLabel(priorKey)}
            hasPrior={priorRows.length > 0}
          />
        </div>
        <TransactionExplorer rows={rows} months={months} defaultMonth={month} property={property} />
        <AnalystChat
          context={`${monthLabel(month)}${property === "all" ? "" : ` · ${property}`}`}
        />
      </main>
    </div>
  );
}
