import { supabase } from "../config/supabaseClient.js";
import { ensureSupabaseResult } from "../utils/supabase.js";
import { AppError } from "../utils/AppError.js";

const TABLE = "expenses";

export async function listExpenses(adminId) {
  const result = await supabase
    .from(TABLE)
    .select("*")
    .eq("admin_id", adminId)
    .order("expense_date", { ascending: false });
  return ensureSupabaseResult(result, "Failed to fetch expenses");
}

export async function createExpense(adminId, payload) {
  const insertPayload = {
    admin_id: adminId,
    title: payload.title,
    category: payload.category || "misc",
    amount: payload.amount,
    paid_via: payload.paid_via || "cash",
    expense_date: payload.expense_date,
    notes: payload.notes || "",
  };

  const result = await supabase
    .from(TABLE)
    .insert(insertPayload)
    .select("*")
    .single();

  const data = ensureSupabaseResult(result, "Failed to create expense");
  if (!data) {
    throw new AppError("Expense not created", 500);
  }
  return data;
}

