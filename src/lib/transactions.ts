import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Txn } from "./finance";

async function fetchTransactions(): Promise<Txn[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select(
      "id, property_name, vendor, date, invoice_number, amount, transaction_type, subcategory, notes, invoice_url",
    )
    .order("date", { ascending: false })
    .limit(5000);

  if (error) throw new Error(error.message);
  return ((data ?? []) as Txn[]).map((r) => ({
    ...r,
    amount: r.amount === null ? null : Number(r.amount),
  }));

}

export const transactionsQuery = queryOptions({
  queryKey: ["transactions"],
  queryFn: fetchTransactions,
  staleTime: 5 * 60_000,
});
