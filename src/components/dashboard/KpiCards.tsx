import { currency, percent, pctChange, signedPct, type Totals } from "@/lib/finance";
import { cn } from "@/lib/utils";

type Props = {
  current: Totals;
  prior: Totals | null;
  priorLabel: string;
};

function Delta({ value, invert }: { value: number | null; invert?: boolean | undefined }) {
  if (value === null || !isFinite(value)) {
    return <span className="text-xs text-muted-foreground">no prior-year data</span>;
  }
  const good = invert ? value < 0 : value > 0;
  const flat = Math.abs(value) < 0.001;
  return (
    <span
      className={cn(
        "num text-xs",
        flat ? "text-muted-foreground" : good ? "text-positive" : "text-negative",
      )}
    >
      {signedPct(value)}
    </span>
  );
}

export function KpiCards({ current, prior, priorLabel }: Props) {
  const items = [
    {
      label: "Revenue",
      value: currency(current.revenue),
      delta: prior ? pctChange(current.revenue, prior.revenue) : null,
    },
    {
      label: "Operating Expenses",
      value: currency(current.operatingExpenses),
      delta: prior ? pctChange(current.operatingExpenses, prior.operatingExpenses) : null,
      invert: true,
    },
    {
      label: "NOI",
      value: currency(current.noi),
      delta: prior ? pctChange(current.noi, prior.noi) : null,
    },
    {
      label: "NOI Margin",
      value: current.noiMargin === null ? "—" : percent(current.noiMargin),
      delta:
        prior && prior.noiMargin !== null && current.noiMargin !== null
          ? current.noiMargin - prior.noiMargin
          : null,
      isPoints: true,
    },
    {
      label: "Capital Expenses",
      value: currency(current.capitalExpenses),
      delta: prior ? pctChange(current.capitalExpenses, prior.capitalExpenses) : null,
      neutral: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-5">
      {items.map((item) => (
        <div key={item.label} className="bg-card px-5 py-4">
          <p className="label-caps">{item.label}</p>
          <p className="num mt-2 text-2xl text-foreground">{item.value}</p>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            {item.isPoints ? (
              item.delta === null ? (
                <span className="text-xs text-muted-foreground">no prior-year data</span>
              ) : (
                <span
                  className={cn(
                    "num text-xs",
                    Math.abs(item.delta) < 0.001
                      ? "text-muted-foreground"
                      : item.delta > 0
                        ? "text-positive"
                        : "text-negative",
                  )}
                >
                  {`${item.delta >= 0 ? "+" : ""}${(item.delta * 100).toFixed(1)} pts`}
                </span>
              )
            ) : item.neutral ? (
              item.delta === null ? (
                <span className="text-xs text-muted-foreground">no prior-year data</span>
              ) : (
                <span className="num text-xs text-muted-foreground">{signedPct(item.delta)}</span>
              )
            ) : (
              <Delta value={item.delta} invert={item.invert} />
            )}
            {item.delta !== null && (
              <span className="text-xs text-muted-foreground">vs {priorLabel}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
