export type Txn = {
  id: string;
  property_name: string | null;
  vendor: string;
  date: string | null;
  invoice_number: string | null;
  amount: number | null;
  transaction_type: string | null;
  subcategory: string | null;
  notes: string | null;
  invoice_url: string | null;
};

export type Totals = {
  revenue: number;
  operatingExpenses: number;
  capitalExpenses: number;
  noi: number;
  noiMargin: number | null;
};

export const INCOME = "Income";
export const OPEX = "Operating Expense";
export const CAPEX = "Capital Expense";

export function monthKey(date: string): string {
  return date.slice(0, 7);
}

export function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function monthLabelShort(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-US", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  });
}

export function priorYearKey(key: string): string {
  const [y, m] = key.split("-");
  return `${Number(y) - 1}-${m}`;
}

export function totals(rows: Txn[]): Totals {
  let revenue = 0;
  let operatingExpenses = 0;
  let capitalExpenses = 0;
  for (const r of rows) {
    const amt = Number(r.amount ?? 0);
    if (r.transaction_type === INCOME) revenue += amt;
    else if (r.transaction_type === OPEX) operatingExpenses += amt;
    else if (r.transaction_type === CAPEX) capitalExpenses += amt;
  }
  const noi = revenue - operatingExpenses;
  return {
    revenue,
    operatingExpenses,
    capitalExpenses,
    noi,
    noiMargin: revenue > 0 ? noi / revenue : null,
  };
}

export function inMonth(rows: Txn[], key: string): Txn[] {
  return rows.filter((r) => r.date && monthKey(r.date) === key);
}

export function allMonths(rows: Txn[]): string[] {
  const set = new Set<string>();
  for (const r of rows) if (r.date) set.add(monthKey(r.date));
  return [...set].sort();
}

export function properties(rows: Txn[]): string[] {
  const set = new Set<string>();
  for (const r of rows) if (r.property_name) set.add(r.property_name);
  return [...set].sort();
}

export function uniqueValues(rows: Txn[], field: keyof Txn): string[] {
  const set = new Set<string>();
  for (const r of rows) {
    const v = r[field];
    if (typeof v === "string" && v) set.add(v);
  }
  return [...set].sort();
}

export function currency(n: number, opts: { compact?: boolean } = {}): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: opts.compact ? "compact" : "standard",
    maximumFractionDigits: opts.compact ? 1 : 0,
  }).format(n);
}

export function percent(n: number, digits = 1): string {
  return `${(n * 100).toFixed(digits)}%`;
}

export function pctChange(current: number, prior: number): number | null {
  if (!prior) return null;
  return (current - prior) / Math.abs(prior);
}

export function signedPct(n: number): string {
  return `${n >= 0 ? "+" : ""}${(n * 100).toFixed(1)}%`;
}

export type MonthlySeriesPoint = {
  month: string;
  label: string;
  revenue: number;
  operatingExpenses: number;
  noi: number;
};

export function monthlySeries(rows: Txn[]): MonthlySeriesPoint[] {
  const byMonth = new Map<string, Txn[]>();
  for (const r of rows) {
    if (!r.date) continue;
    const k = monthKey(r.date);
    const list = byMonth.get(k);
    if (list) list.push(r);
    else byMonth.set(k, [r]);
  }
  return [...byMonth.keys()].sort().map((k) => {
    const t = totals(byMonth.get(k)!);
    return {
      month: k,
      label: monthLabelShort(k),
      revenue: t.revenue,
      operatingExpenses: t.operatingExpenses,
      noi: t.noi,
    };
  });
}

export type PropertyRow = { property: string } & Totals;

export function propertyBreakdown(rows: Txn[]): PropertyRow[] {
  const names = properties(rows);
  return names
    .map((property) => ({
      property,
      ...totals(rows.filter((r) => r.property_name === property)),
    }))
    .sort((a, b) => b.noi - a.noi);
}

export type CategoryRow = { subcategory: string; amount: number; priorAmount: number };

export function expenseBreakdown(current: Txn[], prior: Txn[]): CategoryRow[] {
  const sum = (list: Txn[]) => {
    const m = new Map<string, number>();
    for (const r of list) {
      if (r.transaction_type !== OPEX) continue;
      const key = r.subcategory ?? "Uncategorized";
      m.set(key, (m.get(key) ?? 0) + Number(r.amount ?? 0));
    }
    return m;
  };
  const cur = sum(current);
  const pri = sum(prior);
  return [...cur.entries()]
    .map(([subcategory, amount]) => ({
      subcategory,
      amount,
      priorAmount: pri.get(subcategory) ?? 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export type Highlight = {
  text: string;
  tone: "up" | "down" | "neutral";
};

/**
 * Deterministic factual observations for the selected month, calculated from
 * transaction data only. No AI, no fabricated explanations.
 */
export function buildHighlights(rows: Txn[], month: string): Highlight[] {
  const cur = inMonth(rows, month);
  const priorKey = priorYearKey(month);
  const pri = inMonth(rows, priorKey);
  const out: Highlight[] = [];
  const t = totals(cur);
  const p = totals(pri);
  const priorLabel = monthLabel(priorKey);
  const hasPrior = pri.length > 0;

  if (hasPrior) {
    const rev = pctChange(t.revenue, p.revenue);
    if (rev !== null && Math.abs(rev) >= 0.005) {
      out.push({
        text: `Revenue ${rev > 0 ? "increased" : "decreased"} ${signedPct(rev)} versus ${priorLabel}, from ${currency(p.revenue)} to ${currency(t.revenue)}.`,
        tone: rev > 0 ? "up" : "down",
      });
    }
    const ox = pctChange(t.operatingExpenses, p.operatingExpenses);
    if (ox !== null && Math.abs(ox) >= 0.005) {
      out.push({
        text: `Operating expenses ${ox > 0 ? "increased" : "decreased"} ${signedPct(ox)} versus ${priorLabel}, from ${currency(p.operatingExpenses)} to ${currency(t.operatingExpenses)}.`,
        tone: ox > 0 ? "down" : "up",
      });
    }
    const noi = pctChange(t.noi, p.noi);
    if (noi !== null && Math.abs(noi) >= 0.01) {
      // Largest property NOI swing, used as a factual driver (not an explanation).
      const props = properties(rows);
      let driver: { name: string; delta: number } | null = null;
      for (const name of props) {
        const c = totals(cur.filter((r) => r.property_name === name)).noi;
        const q = totals(pri.filter((r) => r.property_name === name)).noi;
        const delta = c - q;
        if (!driver || Math.abs(delta) > Math.abs(driver.delta)) driver = { name, delta };
      }
      const suffix =
        driver && Math.sign(driver.delta) === Math.sign(t.noi - p.noi)
          ? ` The largest contributor was ${driver.name} (${driver.delta >= 0 ? "+" : "−"}${currency(Math.abs(driver.delta))} NOI).`
          : "";
      out.push({
        text: `Portfolio NOI ${noi > 0 ? "increased" : "decreased"} ${signedPct(noi)} versus ${priorLabel}.${suffix}`,
        tone: noi > 0 ? "up" : "down",
      });
    }

    const cats = expenseBreakdown(cur, pri);
    const grown = cats
      .filter((c) => c.amount - c.priorAmount > 0)
      .sort((a, b) => b.amount - b.priorAmount - (a.amount - a.priorAmount))[0];
    if (grown && grown.amount - grown.priorAmount >= 250) {
      const change = pctChange(grown.amount, grown.priorAmount);
      out.push({
        text: `${grown.subcategory} expense rose ${currency(grown.amount - grown.priorAmount)}${change !== null ? ` (${signedPct(change)})` : ""} versus ${priorLabel}, to ${currency(grown.amount)}.`,
        tone: "down",
      });
    }
  }

  // Largest single transaction of the month.
  const largest = [...cur]
    .filter((r) => r.transaction_type !== INCOME)
    .sort((a, b) => Number(b.amount ?? 0) - Number(a.amount ?? 0))[0];
  if (largest) {
    const monthAvg =
      cur.filter((r) => r.transaction_type !== INCOME).reduce((s, r) => s + Number(r.amount ?? 0), 0) /
      Math.max(1, cur.filter((r) => r.transaction_type !== INCOME).length);
    if (Number(largest.amount ?? 0) > monthAvg * 2.5) {
      out.push({
        text: `Largest non-income transaction: ${currency(Number(largest.amount ?? 0))} to ${largest.vendor} (${largest.subcategory ?? "—"}) at ${largest.property_name ?? "—"}.`,
        tone: "neutral",
      });
    }
  }

  if (t.capitalExpenses > 0) {
    out.push({
      text: `${currency(t.capitalExpenses)} of capital expenses recorded this month, excluded from NOI.`,
      tone: "neutral",
    });
  }

  if (out.length === 0) {
    out.push({
      text: `No material changes detected for ${monthLabel(month)} in the available transaction data.`,
      tone: "neutral",
    });
  }
  return out.slice(0, 5);
}
