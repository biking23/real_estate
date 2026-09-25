import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { currency, type MonthlySeriesPoint } from "@/lib/finance";

const series = [
  { key: "revenue", name: "Revenue", color: "var(--color-chart-1)" },
  { key: "operatingExpenses", name: "Operating Expenses", color: "var(--color-chart-2)" },
  { key: "noi", name: "NOI", color: "var(--color-chart-3)" },
] as const;

export function TrendChart({ data }: { data: MonthlySeriesPoint[]; selectedMonth: string }) {
  // Rolling 12 months ending with the latest available month (data is chronological).
  const rolling = data.slice(-12);
  return (
    <section className="panel p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="display text-2xl">Portfolio Performance Trend</h2>
        <div className="flex flex-wrap gap-4">
          {series.map((s) => (
            <span key={s.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
              {s.name}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-6 h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rolling} margin={{ top: 4, right: 12, bottom: 0, left: 4 }} barGap={2} barCategoryGap="20%">
            <CartesianGrid stroke="var(--color-grid)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
              tickLine={false}
              axisLine={{ stroke: "var(--color-grid)" }}
              interval="preserveStartEnd"
              minTickGap={16}
            />
            <YAxis
              tickFormatter={(v: number) => currency(v, { compact: true })}
              tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
              tickLine={false}
              axisLine={false}
              width={62}
              domain={[(min: number) => Math.min(0, min), "auto"]}
            />
            <ReferenceLine y={0} stroke="var(--color-muted-foreground)" strokeWidth={1} />
            <Tooltip
              cursor={{ fill: "var(--color-grid)", opacity: 0.4 }}
              contentStyle={{
                background: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(value: number, name: string) => [currency(value), name]}
            />
            {series.map((s) => (
              <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color} radius={[2, 2, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
