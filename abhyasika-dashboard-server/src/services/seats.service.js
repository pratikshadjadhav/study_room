import { supabase } from "../config/supabaseClient.js";
import { ensureSupabaseResult } from "../utils/supabase.js";
import { AppError } from "../utils/AppError.js";
import {
  assignSeatToStudent,
  clearStudentSeat,
} from "./students.service.js";

export async function listSeats() {
  const result = await supabase
    .from("seats")
    .select("*, student:current_student_id (name, renewal_date)")
    .order("seat_number", { ascending: true });

  return ensureSupabaseResult(result, "Failed to fetch seats");
}

export async function assignSeat(seatId, studentId) {
  const { data: seat, error: seatError } = await supabase
    .from("seats")
    .select("*")
    .eq("id", seatId)
    .single();
  if (seatError) {
    if (seatError.code === "PGRST116") {
      throw new AppError("Seat not found", 404);
    }
    throw new AppError(seatError.message, 500);
  }

  if (seat.status === "maintenance") {
    throw new AppError("Seat is under maintenance", 400);
  }
  if (seat.current_student_id) {
    throw new AppError("Seat is already occupied", 400);
  }

  const { data: student, error: studentError } = await supabase
    .from("students")
    .select("id, name, current_seat_id")
    .eq("id", studentId)
    .single();
  if (studentError) {
    if (studentError.code === "PGRST116") {
      throw new AppError("Student not found", 404);
    }
    throw new AppError(studentError.message, 500);
  }

  if (student.current_seat_id) {
    throw new AppError("Student already has an assigned seat", 400);
  }

  const updatedSeatResult = await supabase
    .from("seats")
    .update({ status: "occupied", current_student_id: studentId })
    .eq("id", seatId)
    .select("*")
    .single();

  const updatedSeat = ensureSupabaseResult(
    updatedSeatResult,
    "Failed to assign seat"
  );

  const updatedStudent = await assignSeatToStudent(studentId, seatId);

  return { seat: updatedSeat, student: updatedStudent };
}

export async function deallocateSeat(seatId) {
  const { data: seat, error: seatError } = await supabase
    .from("seats")
    .select("*")
    .eq("id", seatId)
    .single();
  if (seatError) {
    if (seatError.code === "PGRST116") {
      throw new AppError("Seat not found", 404);
    }
    throw new AppError(seatError.message, 500);
  }

  const updatedSeatResult = await supabase
    .from("seats")
    .update({ status: "available", current_student_id: null })
    .eq("id", seatId)
    .select("*")
    .single();
  const updatedSeat = ensureSupabaseResult(
    updatedSeatResult,
    "Failed to deallocate seat"
  );

  let updatedStudent = null;
  if (seat.current_student_id) {
    updatedStudent = await clearStudentSeat(seat.current_student_id);
  }

  return { seat: updatedSeat, student: updatedStudent };
}

export async function createSeat(payload = {}) {
  const seatNumber = payload.seat_number?.trim();
  if (!seatNumber) {
    throw new AppError("Seat number is required", 400);
  }

  const normalizedSeatNumber = seatNumber.toUpperCase();
  const existing = await supabase
    .from("seats")
    .select("id")
    .eq("seat_number", normalizedSeatNumber)
    .maybeSingle();

  if (existing.error && existing.error.code !== "PGRST116") {
    throw new AppError(existing.error.message, 500);
  }

  if (existing.data) {
    throw new AppError("Seat number already exists", 409);
  }

  const insertResult = await supabase
    .from("seats")
    .insert({
      seat_number: normalizedSeatNumber,
      status: payload.status ?? "available",
    })
    .select("*")
    .single();

  return ensureSupabaseResult(insertResult, "Failed to create seat");
}
