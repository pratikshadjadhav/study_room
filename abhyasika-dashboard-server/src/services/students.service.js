import { supabase } from "../config/supabaseClient.js";
import { ensureSupabaseResult } from "../utils/supabase.js";
import { AppError } from "../utils/AppError.js";

export async function listStudents({ search, isActive } = {}) {
  let query = supabase
    .from("students")
    .select(
      `*,
      plans:current_plan_id (*),
      seats:current_seat_id (*)`
    )
    .order("name", { ascending: true });

  if (typeof isActive === "boolean") {
    query = query.eq("is_active", isActive);
  }

  if (search) {
    const pattern = `%${search}%`;
    query = query.or(
      `name.ilike.${pattern},phone.ilike.${pattern},email.ilike.${pattern},aadhaar.ilike.${pattern}`
    );
  }

  const result = await query;
  return ensureSupabaseResult(result, "Failed to fetch students");
}

export async function createStudent(payload) {
  const insertPayload = {
    name: payload.name,
    phone: payload.phone ?? null,
    email: payload.email ?? null,
    aadhaar: payload.aadhaar ?? null,
    pan_card: payload.pan_card ?? null,
    address: payload.address ?? null,
    photo_url: payload.photo_url ?? null,
    preferred_shift: payload.preferred_shift ?? "Morning",
    fee_plan_type: payload.fee_plan_type ?? "monthly",
    fee_cycle: payload.fee_cycle ?? "calendar",
    limited_days: payload.limited_days ?? null,
    registration_paid: payload.registration_paid ?? false,
    join_date: payload.join_date ?? new Date().toISOString(),
    is_active: payload.is_active ?? true,
    current_plan_id: payload.current_plan_id ?? null,
    current_seat_id: payload.current_seat_id ?? null,
    renewal_date: payload.renewal_date ?? null,
  };

  const result = await supabase
    .from("students")
    .insert(insertPayload)
    .select("*")
    .single();

  return ensureSupabaseResult(result, "Failed to create student");
}

export async function updateStudent(studentId, updates) {
  const updatePayload = {
    ...updates,
  };
  const result = await supabase
    .from("students")
    .update(updatePayload)
    .eq("id", studentId)
    .select("*")
    .single();

  const data = ensureSupabaseResult(result, "Failed to update student");
  if (!data) {
    throw new AppError("Student not found", 404);
  }
  return data;
}

export async function toggleStudentActive(studentId) {
  const { data: student, error } = await supabase
    .from("students")
    .select("is_active")
    .eq("id", studentId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      throw new AppError("Student not found", 404);
    }
    throw new AppError(error.message, 500);
  }

  const result = await supabase
    .from("students")
    .update({ is_active: !student.is_active })
    .eq("id", studentId)
    .select("*")
    .single();

  return ensureSupabaseResult(result, "Failed to toggle student status");
}

export async function updateStudentPlan(studentId, planId, renewalDate) {
  const result = await supabase
    .from("students")
    .update({
      current_plan_id: planId,
      renewal_date: renewalDate ?? null,
    })
    .eq("id", studentId)
    .select("*")
    .single();

  return ensureSupabaseResult(result, "Failed to update student plan");
}

export async function clearStudentSeat(studentId) {
  const result = await supabase
    .from("students")
    .update({ current_seat_id: null })
    .eq("id", studentId)
    .select("*")
    .single();

  return ensureSupabaseResult(result, "Failed to clear student's seat");
}

export async function assignSeatToStudent(studentId, seatId) {
  const result = await supabase
    .from("students")
    .update({ current_seat_id: seatId })
    .eq("id", studentId)
    .select("*")
    .single();

  return ensureSupabaseResult(result, "Failed to assign seat to student");
}
