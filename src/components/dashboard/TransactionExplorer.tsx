import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import {
  currency,
  monthKey,
  monthLabel,
  uniqueValues,
  type Txn,
} from "@/lib/finance";
import { cn } from "@/lib/utils";

type SortKey = "date" | "amount";

const ALL = "all";

function Select({
  label,
  value,
  options,
  onChange,
  allLabel,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  allLabel: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="label-caps">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 min-w-[9rem] rounded-md border border-input bg-card px-2.5 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value={ALL}>{allLabel}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function TransactionExplorer({
  rows,
  months,
  defaultMonth,
  property,
}: {
  rows: Txn[];
  months: string[];
  defaultMonth: string;
  property: string | "all";
}) {
  const [month, setMonth] = useState<string>(defaultMonth);
  const [propertyFilter, setPropertyFilter] = useState<string>(property);
  const [vendor, setVendor] = useState<string>(ALL);
  const [type, setType] = useState<string>(ALL);
  const [subcategory, setSubcategory] = useState<string>(ALL);
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  useEffect(() => setMonth(defaultMonth), [defaultMonth]);
  useEffect(() => setPropertyFilter(property), [property]);

  const filtered = useMemo(() => {
    const out = rows.filter((r) => {
      if (month !== ALL && (!r.date || monthKey(r.date) !== month)) return false;
      if (propertyFilter !== ALL && r.property_name !== propertyFilter) return false;
      if (vendor !== ALL && r.vendor !== vendor) return false;
      if (type !== ALL && r.transaction_type !== type) return false;
      if (subcategory !== ALL && r.subcategory !== subcategory) return false;
      return true;
    });
    out.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortKey === "amount") return (Number(a.amount ?? 0) - Number(b.amount ?? 0)) * dir;
      return ((a.date ?? "") < (b.date ?? "") ? -1 : 1) * dir;
    });
    return out;
  }, [rows, month, propertyFilter, vendor, type, subcategory, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const SortHeader = ({ label, keyName }: { label: string; keyName: SortKey }) => (
    <button
      type="button"
      onClick={() => toggleSort(keyName)}
      className="label-caps inline-flex items-center gap-1 hover:text-foreground"
    >
      {label}
      {sortKey === keyName &&
        (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
    </button>
  );

  return (
    <section className="panel p-6" id="transactions">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="display text-2xl">Transaction Explorer</h2>
        <p className="num text-xs text-muted-foreground">
          {filtered.length} transactions · {currency(filtered.reduce((s, r) => s + Number(r.amount ?? 0), 0))}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <Select
          label="Month"
          value={month}
          allLabel="All months"
          options={months.map((m) => ({ value: m, label: monthLabel(m) }))}
          onChange={setMonth}
        />
        <Select
          label="Property"
          value={propertyFilter}
          allLabel="All properties"
          options={uniqueValues(rows, "property_name").map((v) => ({ value: v, label: v }))}
          onChange={setPropertyFilter}
        />
        <Select
          label="Type"
          value={type}
          allLabel="All types"
          options={uniqueValues(rows, "transaction_type").map((v) => ({ value: v, label: v }))}
          onChange={setType}
        />
        <Select
          label="Subcategory"
          value={subcategory}
          allLabel="All subcategories"
          options={uniqueValues(rows, "subcategory").map((v) => ({ value: v, label: v }))}
          onChange={setSubcategory}
        />
        <Select
          label="Vendor"
          value={vendor}
          allLabel="All vendors"
          options={uniqueValues(rows, "vendor").map((v) => ({ value: v, label: v }))}
          onChange={setVendor}
        />
      </div>

      <div className="mt-5 max-h-[32rem] overflow-auto rounded-md border border-border">
        <table className="w-full min-w-[54rem] text-sm">
          <thead className="sticky top-0 bg-surface">
            <tr className="border-b border-border">
              <th className="px-3 py-2 text-left">
                <SortHeader label="Date" keyName="date" />
              </th>
              <th className="label-caps px-3 py-2 text-left font-medium">Property</th>
              <th className="label-caps px-3 py-2 text-left font-medium">Vendor</th>
              <th className="px-3 py-2 text-right">
                <SortHeader label="Amount" keyName="amount" />
              </th>
              <th className="label-caps px-3 py-2 text-left font-medium">Type</th>
              <th className="label-caps px-3 py-2 text-left font-medium">Subcategory</th>
              <th className="label-caps px-3 py-2 text-left font-medium">Invoice</th>
              <th className="label-caps px-3 py-2 text-left font-medium">Notes</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-b border-border/60 last:border-0 hover:bg-secondary/60">
                <td className="num whitespace-nowrap px-3 py-2.5">{r.date ?? "—"}</td>
                <td className="whitespace-nowrap px-3 py-2.5">{r.property_name ?? "—"}</td>
                <td className="px-3 py-2.5">{r.vendor}</td>
                <td
                  className={cn(
                    "num whitespace-nowrap px-3 py-2.5 text-right",
                    r.transaction_type === "Income" ? "text-positive" : "text-foreground",
                  )}
                >
                  {currency(Number(r.amount ?? 0))}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground">
                  {r.transaction_type ?? "—"}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground">
                  {r.subcategory ?? "—"}
                </td>
                <td className="num whitespace-nowrap px-3 py-2.5 text-muted-foreground">
                  {r.invoice_number ?? "—"}
                </td>
                <td className="max-w-[18rem] truncate px-3 py-2.5 text-muted-foreground" title={r.notes ?? ""}>
                  {r.notes ?? "—"}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-sm text-muted-foreground">
                  No transactions match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
