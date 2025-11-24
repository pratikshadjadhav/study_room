import { supabase } from "../config/supabaseClient.js";
import { ensureSupabaseResult } from "../utils/supabase.js";
import { AppError } from "../utils/AppError.js";
import { updateStudentPlan } from "./students.service.js";

export async function listPayments({ limit = 100, startDate, endDate } = {}) {
  let query = supabase
    .from("payments")
    .select(
      `*,
      student:student_id (id, name),
      plan:plan_id (id, name, duration_days, price)`
    )
    .order("payment_date", { ascending: false })
    .limit(limit);

  if (startDate) {
    query = query.gte("payment_date", `${startDate}T00:00:00Z`);
  }
  if (endDate) {
    query = query.lte("payment_date", `${endDate}T23:59:59Z`);
  }

  const result = await query;
  return ensureSupabaseResult(result, "Failed to fetch payments");
}

export async function createPayment({
  student_id,
  plan_id,
  amount_paid,
  valid_from,
  valid_until,
  payment_mode,
  includes_registration,
  notes,
}) {
  const { data: student, error: studentError } = await supabase
    .from("students")
    .select("id")
    .eq("id", student_id)
    .single();
  if (studentError) {
    if (studentError.code === "PGRST116") {
      throw new AppError("Student not found", 404);
    }
    throw new AppError(studentError.message, 500);
  }

  const { data: plan, error: planError } = await supabase
    .from("plans")
    .select("*")
    .eq("id", plan_id)
    .single();
  if (planError) {
    if (planError.code === "PGRST116") {
      throw new AppError("Plan not found", 404);
    }
    throw new AppError(planError.message, 500);
  }

  const resolvedValidFrom =
    valid_from ?? new Date().toISOString().slice(0, 10);
  const resolvedValidUntil =
    valid_until ??
    new Date(
      Date.parse(resolvedValidFrom) + plan.duration_days * 86400000
    )
      .toISOString()
      .slice(0, 10);
  const resolvedAmount =
    typeof amount_paid === "number" && !Number.isNaN(amount_paid)
      ? amount_paid
      : plan.price;

  const insertResult = await supabase
    .from("payments")
    .insert({
      student_id,
      plan_id,
      amount_paid: resolvedAmount,
      valid_from: resolvedValidFrom,
      valid_until: resolvedValidUntil,
      payment_mode: payment_mode || "upi",
      includes_registration: Boolean(includes_registration),
      notes: notes ?? null,
    })
    .select("*")
    .single();

  const payment = ensureSupabaseResult(insertResult, "Failed to create payment");

  const updatedStudent = await updateStudentPlan(
    student_id,
    plan_id,
    resolvedValidUntil
  );

  if (includes_registration) {
    await supabase
      .from("students")
      .update({ registration_paid: true })
      .eq("id", student_id);
    updatedStudent.registration_paid = true;
  }

  return { payment, student: updatedStudent };
}
