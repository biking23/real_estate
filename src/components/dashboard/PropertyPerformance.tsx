import { currency, percent, type PropertyRow } from "@/lib/finance";
import { cn } from "@/lib/utils";

type Props = {
  rows: PropertyRow[];
  selected: string | "all";
  onSelect: (property: string | "all") => void;
};

export function PropertyPerformance({ rows, selected, onSelect }: Props) {
  return (
    <section className="panel p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="display text-2xl">Property Performance</h2>
        <p className="text-xs text-muted-foreground">Select a property to focus the dashboard</p>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="label-caps py-2 text-left font-medium">Property</th>
              <th className="label-caps py-2 text-right font-medium">Revenue</th>
              <th className="label-caps py-2 text-right font-medium">Operating Exp.</th>
              <th className="label-caps py-2 text-right font-medium">NOI</th>
              <th className="label-caps py-2 text-right font-medium">NOI Margin</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const isSelected = selected === r.property;
              return (
                <tr
                  key={r.property}
                  onClick={() => onSelect(isSelected ? "all" : r.property)}
                  className={cn(
                    "cursor-pointer border-b border-border/60 transition-colors hover:bg-secondary",
                    isSelected && "bg-accent/60",
                  )}
                >
                  <td className="py-3 pr-4 font-medium text-foreground">{r.property}</td>
                  <td className="num py-3 text-right">{currency(r.revenue)}</td>
                  <td className="num py-3 text-right">{currency(r.operatingExpenses)}</td>
                  <td className="num py-3 text-right text-foreground">{currency(r.noi)}</td>
                  <td className="num py-3 text-right">
                    {r.noiMargin === null ? "—" : percent(r.noiMargin)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
