import {
  CartesianGrid,
  Line,
  LineChart,
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

export function TrendChart({ data, selectedMonth }: { data: MonthlySeriesPoint[]; selectedMonth: string }) {
  return (
    <section className="panel p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="display text-2xl">Portfolio Performance Trend</h2>
        <div className="flex flex-wrap gap-4">
          {series.map((s) => (
            <span key={s.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="h-0.5 w-4" style={{ backgroundColor: s.color }} />
              {s.name}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-6 h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 12, bottom: 0, left: 4 }}>
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
            />
            <Tooltip
              contentStyle={{
                background: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(value: number, name: string) => [currency(value), name]}
            />
            {series.map((s) => (
              <Line
                key={s.key}
                type="linear"
                dataKey={s.key}
                name={s.name}
                stroke={s.color}
                strokeWidth={s.key === "noi" ? 2.25 : 1.5}
                dot={(props: { cx?: number; cy?: number; payload?: MonthlySeriesPoint }) =>
                  props.payload?.month === selectedMonth ? (
                    <circle
                      key={`${s.key}-${props.payload.month}`}
                      cx={props.cx}
                      cy={props.cy}
                      r={3.5}
                      fill={s.color}
                    />
                  ) : (
                    <g key={`${s.key}-${props.payload?.month ?? ""}`} />
                  )
                }
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
