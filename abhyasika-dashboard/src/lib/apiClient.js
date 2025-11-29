import { supabase } from "./supabaseBrowser.js";

const ensureResult = (result, fallbackMessage) => {
  if (result.error) {
    throw new Error(result.error.message ?? fallbackMessage);
  }
  return result.data;
};

const ensureSingle = (result, fallbackMessage) => {
  if (result.error) {
    throw new Error(result.error.message ?? fallbackMessage);
  }
  if (!result.data) {
    throw new Error(fallbackMessage);
  }
  return result.data;
};

const normalizedDate = (value) =>
  value ? new Date(value).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);

export function createApiClient() {
  const recordAudit = async (entry) => {
    if (!entry?.object_type || !entry?.object_id) return;
    try {
      await supabase.from("audit_log").insert({
        object_type: entry.object_type,
        object_id: entry.object_id,
        action: entry.action ?? "update",
        actor_id: entry.actor_id ?? null,
        actor_role: entry.actor_role ?? null,
        metadata: entry.metadata ?? {},
      });
    } catch (err) {
      console.warn("Audit log skipped", err?.message ?? err);
    }
  };

  return {
    async listRoles({ ownerId, includeRoleIds = [] } = {}) {
      const roleIds = Array.isArray(includeRoleIds) ? includeRoleIds.filter(Boolean) : [];
      if (!ownerId && roleIds.length === 0) return [];

      const filters = [];
      if (ownerId) {
        filters.push(`created_by.eq.${ownerId}`);
      }
      if (roleIds.length) {
        const formattedRoleIds = roleIds.map((id) => `"${id}"`).join(",");
        filters.push(`id.in.(${formattedRoleIds})`);
      }

      let query = supabase.from("admin_roles").select("*");
      if (filters.length) {
        query = query.or(filters.join(","));
      }

      const result = await query.order("name", { ascending: true });
      if (result.error) {
        if (result.error.code === "PGRST116") {
          return [];
        }
        throw new Error(result.error.message ?? "Failed to load roles");
      }
      return result.data ?? [];
    },

    async listPlans() {
      const result = await supabase.from("plans").select("*").order("name", { ascending: true });
      return ensureResult(result, "Failed to load plans");
    },

    async listStudents({ search, isActive } = {}) {
      let query = supabase
        .from("students")
        .select("*")
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
      return ensureResult(result, "Failed to load students");
    },

    async listSeats() {
      const result = await supabase.from("seats").select("*").order("seat_number", { ascending: true });
      return ensureResult(result, "Failed to load seats");
    },

    async listPayments() {
      const result = await supabase.from("payments").select("*").order("payment_date", { ascending: false });
      return ensureResult(result, "Failed to load payments");
    },

    async listExpenses() {
      const result = await supabase.from("expenses").select("*").order("expense_date", { ascending: false });
      return ensureResult(result, "Failed to load expenses");
    },

    async listExpenseCategories() {
      const result = await supabase
        .from("expense_categories")
        .select("*")
        .order("name", { ascending: true });
      if (result.error) {
        if (result.error.code === "PGRST116") {
          return [];
        }
        throw new Error(result.error.message ?? "Failed to load categories");
      }
      return result.data ?? [];
    },

    async createStudent(payload) {
      const audit = payload.audit;
      const insertPayload = {
        name: payload.name,
        phone: payload.phone ?? null,
        email: payload.email ?? null,
        aadhaar: payload.aadhaar ?? null,
        pan_card: payload.pan_card ?? null,
        address: payload.address ?? null,
        city: payload.city ?? null,
        state: payload.state ?? null,
        pincode: payload.pincode ?? null,
        preferred_shift: payload.preferred_shift ?? "Morning",
        fee_plan_type: payload.fee_plan_type ?? "monthly",
        fee_cycle: payload.fee_cycle ?? "calendar",
        limited_days: payload.fee_plan_type === "limited" ? payload.limited_days ?? null : null,
        registration_paid: Boolean(payload.registration_paid),
        join_date: payload.join_date ?? normalizedDate(),
        is_active: payload.is_active ?? true,
        current_plan_id: payload.current_plan_id ?? null,
        current_seat_id: payload.current_seat_id ?? null,
        renewal_date: payload.renewal_date ?? null,
        registration_source: payload.registration_source ?? "admin_panel",
        registered_by_role: payload.registered_by_role ?? null,
        photo_url: payload.photo_url ?? null,
      };

      const result = await supabase.from("students").insert(insertPayload).select("*").single();
      const created = ensureSingle(result, "Failed to create student");
      await recordAudit({
        object_type: "students",
        object_id: created.id,
        action: "create",
        actor_id: audit?.actor_id,
        actor_role: audit?.actor_role,
        metadata: { name: created.name, phone: created.phone },
      });
      return created;
    },

    async updateStudent(id, updates) {
      const audit = updates?.audit;
      const patch = { ...updates };
      delete patch.audit;
      const result = await supabase.from("students").update(patch).eq("id", id).select("*").single();
      const updated = ensureSingle(result, "Failed to update student");
      await recordAudit({
        object_type: "students",
        object_id: id,
        action: "update",
        actor_id: audit?.actor_id,
        actor_role: audit?.actor_role,
        metadata: patch,
      });
      return updated;
    },

    async toggleStudentActive(id) {
      const audit = arguments[1] || null;
      const { data: previous, error: fetchError } = await supabase
        .from("students")
        .select("is_active")
        .eq("id", id)
        .single();
      if (fetchError) throw new Error(fetchError.message ?? "Student not found");

      const result = await supabase
        .from("students")
        .update({ is_active: !previous.is_active })
        .eq("id", id)
        .select("*")
        .single();
      const updated = ensureSingle(result, "Failed to toggle student status");
      await recordAudit({
        object_type: "students",
        object_id: id,
        action: updated.is_active ? "activate" : "deactivate",
        actor_id: audit?.actor_id,
        actor_role: audit?.actor_role,
        metadata: { is_active: updated.is_active, previous_active: previous.is_active },
      });
      return updated;
    },

    async assignSeat({ seatId, studentId }) {
      const audit = arguments[0]?.audit;
      const seatCheck = await supabase.from("seats").select("*").eq("id", seatId).single();
      if (seatCheck.error) throw new Error(seatCheck.error.message ?? "Seat not found");
      const seat = seatCheck.data;
      if (seat.status === "maintenance") throw new Error("Seat is under maintenance");
      if (seat.current_student_id) throw new Error("Seat is already occupied");

      const studentCheck = await supabase
        .from("students")
        .select("current_seat_id")
        .eq("id", studentId)
        .single();
      if (studentCheck.error) throw new Error(studentCheck.error.message ?? "Student not found");
      if (studentCheck.data.current_seat_id) throw new Error("Student already has a seat");

      const seatResult = await supabase
        .from("seats")
        .update({ status: "occupied", current_student_id: studentId })
        .eq("id", seatId)
        .select("*")
        .single();
      const updatedSeat = ensureSingle(seatResult, "Failed to assign seat");

      const studentResult = await supabase
        .from("students")
        .update({ current_seat_id: seatId })
        .eq("id", studentId)
        .select("*")
        .single();
      const updatedStudent = ensureSingle(studentResult, "Failed to update student seat");

      await recordAudit({
        object_type: "seats",
        object_id: seatId,
        action: "assign",
        actor_id: audit?.actor_id,
        actor_role: audit?.actor_role,
        metadata: { student_id: studentId, seat_number: seat.seat_number },
      });
      await recordAudit({
        object_type: "students",
        object_id: studentId,
        action: "seat-assigned",
        actor_id: audit?.actor_id,
        actor_role: audit?.actor_role,
        metadata: { seat_id: seatId, seat_number: seat.seat_number },
      });

      return { seat: updatedSeat, student: updatedStudent };
    },

    async deallocateSeat(payload) {
      const seatId = payload?.seatId ?? payload;
      const audit = payload?.audit;
      const seatFetch = await supabase.from("seats").select("*").eq("id", seatId).single();
      if (seatFetch.error) throw new Error(seatFetch.error.message ?? "Seat not found");
      const seat = seatFetch.data;

      const seatResult = await supabase
        .from("seats")
        .update({ status: "available", current_student_id: null })
        .eq("id", seatId)
        .select("*")
        .single();
      const updatedSeat = ensureSingle(seatResult, "Failed to deallocate seat");

      let updatedStudent = null;
      if (seat.current_student_id) {
        const studentResult = await supabase
          .from("students")
          .update({ current_seat_id: null })
          .eq("id", seat.current_student_id)
          .select("*")
          .single();
        updatedStudent = ensureSingle(studentResult, "Failed to update student");
      }

      await recordAudit({
        object_type: "seats",
        object_id: seatId,
        action: "deallocate",
        actor_id: audit?.actor_id,
        actor_role: audit?.actor_role,
        metadata: { previous_student_id: seat.current_student_id, seat_number: seat.seat_number },
      });
      if (seat.current_student_id) {
        await recordAudit({
          object_type: "students",
          object_id: seat.current_student_id,
          action: "seat-removed",
          actor_id: audit?.actor_id,
          actor_role: audit?.actor_role,
          metadata: { seat_id: seatId, seat_number: seat.seat_number },
        });
      }

      return { seat: updatedSeat, student: updatedStudent };
    },

    async createPayment(payload) {
      const audit = payload.audit;
      const { student_id, plan_id } = payload;
      const student = ensureSingle(
        await supabase.from("students").select("*").eq("id", student_id).single(),
        "Student not found"
      );
      const plan = ensureSingle(
        await supabase.from("plans").select("*").eq("id", plan_id).single(),
        "Plan not found"
      );

      const validFrom = normalizedDate(payload.valid_from);
      const validUntil =
        payload.valid_until ??
        new Date(Date.parse(validFrom) + plan.duration_days * 86400000).toISOString().slice(0, 10);
      const amount =
        typeof payload.amount_paid === "number" && !Number.isNaN(payload.amount_paid)
          ? payload.amount_paid
          : plan.price;

      const paymentResult = await supabase
        .from("payments")
        .insert({
          student_id,
          plan_id,
          collected_role_id: payload.collected_role_id ?? null,
          amount_paid: amount,
          valid_from: validFrom,
          valid_until: validUntil,
          payment_mode: payload.payment_mode ?? "upi",
          includes_registration: Boolean(payload.includes_registration),
          notes: payload.notes ?? null,
        })
        .select("*")
        .single();
      const payment = ensureSingle(paymentResult, "Failed to record payment");

      const studentUpdate = await supabase
        .from("students")
        .update({
          current_plan_id: plan_id,
          renewal_date: validUntil,
          registration_paid: student.registration_paid || Boolean(payload.includes_registration),
        })
        .eq("id", student_id)
        .select("*")
        .single();
      const updatedStudent = ensureSingle(studentUpdate, "Failed to update student plan");

      await recordAudit({
        object_type: "payments",
        object_id: payment.id,
        action: "create",
        actor_id: audit?.actor_id,
        actor_role: audit?.actor_role,
        metadata: {
          student_id,
          plan_id,
          amount_paid: amount,
          payment_mode: payload.payment_mode ?? "upi",
          includes_registration: Boolean(payload.includes_registration),
        },
      });
      await recordAudit({
        object_type: "students",
        object_id: student_id,
        action: "payment-applied",
        actor_id: audit?.actor_id,
        actor_role: audit?.actor_role,
        metadata: {
          plan_id,
          renewal_date: validUntil,
          registration_paid: student.registration_paid || Boolean(payload.includes_registration),
        },
      });

      return { payment, student: updatedStudent };
    },

    async createExpense(payload) {
      const audit = payload.audit;
      const patch = { ...payload };
      delete patch.audit;
      const result = await supabase
        .from("expenses")
        .insert({
          title: patch.title,
          category: patch.category ?? "misc",
          amount: Number(patch.amount) || 0,
          paid_via: patch.paid_via ?? "cash",
          expense_date: patch.expense_date ?? normalizedDate(),
          notes: patch.notes ?? null,
        })
        .select("*")
        .single();
      const expense = ensureSingle(result, "Failed to log expense");
      await recordAudit({
        object_type: "expenses",
        object_id: expense.id,
        action: "create",
        actor_id: audit?.actor_id,
        actor_role: audit?.actor_role,
        metadata: {
          amount: expense.amount,
          category: expense.category,
          paid_via: expense.paid_via,
        },
      });
      return expense;
    },

    async createExpenseCategory(payload) {
      const audit = payload.audit;
      const insertPayload = {
        name: payload.name,
        value: payload.value,
      };
      const result = await supabase
        .from("expense_categories")
        .insert(insertPayload)
        .select("*")
        .single();
      const category = ensureSingle(result, "Failed to create category");
      await recordAudit({
        object_type: "expense_categories",
        object_id: category.id,
        action: "create",
        actor_id: audit?.actor_id,
        actor_role: audit?.actor_role,
        metadata: { name: category.name },
      });
      return category;
    },

    async deleteExpenseCategory(id) {
      const audit = arguments[1] || null;
      const result = await supabase
        .from("expense_categories")
        .delete()
        .eq("id", id)
        .select("id")
        .single();
      const deleted = ensureSingle(result, "Failed to delete category");
      await recordAudit({
        object_type: "expense_categories",
        object_id: id,
        action: "delete",
        actor_id: audit?.actor_id,
        actor_role: audit?.actor_role,
      });
      return deleted;
    },

    async createSeat(payload) {
      const audit = payload.audit;
      const seatNumber = payload.seat_number?.trim();
      if (!seatNumber) {
        throw new Error("Seat number is required");
      }
      const normalized = seatNumber.toUpperCase();
      const existing = await supabase
        .from("seats")
        .select("id")
        .eq("seat_number", normalized)
        .maybeSingle();
      if (existing.data) {
        throw new Error("Seat number already exists");
      }

      const result = await supabase
        .from("seats")
        .insert({ seat_number: normalized, status: payload.status ?? "available" })
        .select("*")
        .single();
      const seat = ensureSingle(result, "Failed to create seat");
      await recordAudit({
        object_type: "seats",
        object_id: seat.id,
        action: "create",
        actor_id: audit?.actor_id,
        actor_role: audit?.actor_role,
        metadata: { seat_number: seat.seat_number },
      });
      return seat;
    },

    async importStudents(rows, audit) {
      if (!Array.isArray(rows) || rows.length === 0) return [];
      const payload = rows.map((row) => ({
        name: row.name,
        phone: row.phone,
        email: row.email || null,
        gender: row.gender || null,
        aadhaar: row.aadhaar || null,
        preferred_shift: row.preferred_shift || "Morning",
        fee_plan_type: row.fee_plan_type || "monthly",
        fee_cycle: row.fee_cycle || "calendar",
        limited_days: row.fee_plan_type === "limited" ? row.limited_days ?? null : null,
        registration_paid: Boolean(row.registration_paid),
        join_date: row.join_date ?? normalizedDate(),
        current_plan_id: row.plan_id || null,
        current_seat_id: row.seat_id || null,
        registration_source: "bulk_import",
        registered_by_role: audit?.actor_role ?? "Importer",
      }));
      const result = await supabase.from("students").insert(payload).select("*");
      return ensureResult(result, "Failed to import students");
    },

    async importPayments(rows, audit) {
      if (!Array.isArray(rows) || rows.length === 0) return [];
      const created = [];
      for (const row of rows) {
        const { payment, student } = await this.createPayment({
          student_id: row.student_id,
          plan_id: row.plan_id,
          amount_paid: row.amount_paid,
          valid_from: row.valid_from,
          valid_until: row.valid_until,
          payment_mode: row.payment_mode || "upi",
          includes_registration: Boolean(row.includes_registration),
          notes: row.notes || null,
          collected_role_id: row.collected_role_id || null,
          audit,
        });
        created.push({ payment, student });
      }
      return created;
    },

    async importExpenses(rows, audit) {
      if (!Array.isArray(rows) || rows.length === 0) return [];
      const payload = rows.map((row) => ({
        title: row.title,
        category: row.category || "misc",
        amount: Number(row.amount) || 0,
        paid_via: row.paid_via || "cash",
        expense_date: row.expense_date ?? normalizedDate(),
        notes: row.notes || null,
      }));
      const result = await supabase.from("expenses").insert(payload).select("*");
      const inserted = ensureResult(result, "Failed to import expenses");
      if (inserted.length) {
        await recordAudit({
          object_type: "expenses",
          object_id: inserted[0].id,
          action: "bulk-import",
          actor_id: audit?.actor_id,
          actor_role: audit?.actor_role,
          metadata: { count: inserted.length },
        });
      }
      return inserted;
    },

    async recordImportLog(entry) {
      if (!entry) return null;
      const payload = {
        table_name: entry.table,
        file_name: entry.fileName,
        total_rows: entry.totalRows ?? 0,
        success_rows: entry.successRows ?? 0,
        duplicate_rows: entry.duplicateRows ?? 0,
        invalid_rows: entry.invalidRows ?? 0,
        created_by: entry.actorId ?? null,
        actor_role: entry.actorRole ?? null,
        metadata: entry.metadata ?? {},
      };
      const result = await supabase.from("import_logs").insert(payload).select("*").single();
      return ensureSingle(result, "Failed to log import");
    },
  };
}
