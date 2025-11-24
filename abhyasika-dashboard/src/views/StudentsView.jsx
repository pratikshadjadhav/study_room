import React, { useEffect, useMemo, useState } from "react";
import LucideIcon from "../components/icons/LucideIcon.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const PAGE_SIZE = 10;
const feeTypeMap = {
  monthly: {
    label: "Monthly",
    tone: "bg-indigo-50 text-indigo-600",
  },
  limited: {
    label: "Limited Days",
    tone: "bg-amber-50 text-amber-600",
  },
};

function StudentsView({
  students,
  seats,
  plans,
  onOpenModal,
  onToggleActive,
  busyIds,
  onNavigate = () => {},
  payments = [],
  roles = [],
}) {
  const { hasPermission } = useAuth();
  const [query, setQuery] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState(null);
  const canCreateStudent = hasPermission("students", "add");
  const canEditStudent = hasPermission("students", "edit");
  const canToggleStatus = hasPermission("students", "delete");
  const canLogPayment = hasPermission("payments", "add");

  const seatMap = useMemo(() => {
    const map = new Map();
    seats.forEach((seat) => map.set(seat.id, seat));
    return map;
  }, [seats]);

  const planMap = useMemo(() => {
    const map = new Map();
    plans.forEach((plan) => map.set(plan.id, plan));
    return map;
  }, [plans]);

  const roleMap = useMemo(() => {
    const map = new Map();
    roles.forEach((role) => map.set(role.id, role));
    return map;
  }, [roles]);

  const latestPaymentByStudent = useMemo(() => {
    const map = new Map();
    payments.forEach((payment) => {
      const existing = map.get(payment.student_id);
      if (
        !existing ||
        new Date(payment.payment_date) > new Date(existing.payment_date)
      ) {
        map.set(payment.student_id, payment);
      }
    });
    return map;
  }, [payments]);

  const summary = useMemo(() => {
    const totals = {
      active: 0,
      limited: 0,
      monthly: 0,
      registrationsPending: 0,
    };
    students.forEach((student) => {
      if (student.is_active) totals.active += 1;
      if (student.fee_plan_type === "limited") totals.limited += 1;
      if (student.fee_plan_type === "monthly") totals.monthly += 1;
      if (!student.registration_paid) totals.registrationsPending += 1;
    });
    return totals;
  }, [students]);

  const filtered = students.filter((student) => {
    const matchQuery = query.trim()
      ? [
          student.name,
          student.phone,
          student.email,
          student.aadhaar,
        ]
          .filter(Boolean)
          .some((field) =>
            field.toLowerCase().includes(query.trim().toLowerCase())
          )
      : true;
    const matchPlan =
      planFilter === "all" ? true : student.fee_plan_type === planFilter;
    return matchQuery && matchPlan;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedStudents = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const activeOnly = useMemo(
    () => filtered.filter((student) => student.is_active),
    [filtered]
  );

  const renderRow = (student, index, baseIndex = 0) => {
    const seat = seatMap.get(student.current_seat_id);
    const plan = planMap.get(student.current_plan_id);
    const busy = busyIds.includes(student.id);
    const feeInfo = feeTypeMap[student.fee_plan_type] || feeTypeMap.monthly;
    const lastPayment = latestPaymentByStudent.get(student.id);
    const collectorRole = lastPayment
      ? roleMap.get(lastPayment.collected_role_id)
      : null;
    const hasAnyActions = canEditStudent || canLogPayment || canToggleStatus;

    return (
      <tr key={student.id} className="hover:bg-slate-50/70">
        <td className="px-4 py-3 text-xs font-semibold text-slate-400">
          {baseIndex + index + 1}
        </td>
        <td className="px-4 py-3">
          <div className="font-semibold text-slate-900">{student.name}</div>
          <p className="text-xs text-slate-500">{student.email || "No email"}</p>
        </td>
        <td className="px-4 py-3 text-sm text-slate-600">
          {student.phone || "—"}
          <p className="text-xs text-slate-400">
            {student.preferred_shift || "General"}
          </p>
        </td>
        <td className="px-4 py-3 text-sm text-slate-600">
          <div className="flex flex-col gap-1">
            <span>{plan ? plan.name : "Not set"}</span>
            <span
              className={`inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${feeInfo.tone}`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {feeInfo.label}
            </span>
            <span className="text-xs text-slate-500">
              {student.fee_plan_type === "limited"
                ? `${student.limited_days || plan?.duration_days || 0} days`
                : student.fee_cycle === "rolling"
                ? "Rolling 30 days"
                : "Calendar month"}
            </span>
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-slate-600">
          {seat ? seat.seat_number : "Unassigned"}
          <p className="text-xs text-slate-400">
            Joined{" "}
            {student.join_date
              ? new Date(student.join_date).toLocaleDateString()
              : "—"}
          </p>
        </td>
        <td className="px-4 py-3">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
              student.is_active
                ? "bg-emerald-50 text-emerald-600"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                student.is_active ? "bg-emerald-500" : "bg-slate-400"
              }`}
            />
            {student.is_active ? "Active" : "Inactive"}
          </span>
        </td>
        <td className="px-4 py-3 text-sm text-slate-600">
          {lastPayment
            ? lastPayment.payment_mode === "cash"
              ? "Cash"
              : "UPI"
            : "—"}
          <p className="text-xs text-slate-400">
            {lastPayment
              ? collectorRole?.name ?? "Role not tagged"
              : "No payments"}
          </p>
        </td>
        <td className="relative px-4 py-3 text-right">
          {hasAnyActions ? (
            <>
              <button
                onClick={() =>
                  setOpenMenuId((prev) => (prev === student.id ? null : student.id))
                }
                className="inline-flex items-center rounded-full border border-slate-200 px-2 py-1 text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600"
              >
                <LucideIcon name="MoreHorizontal" className="h-4 w-4" />
              </button>
              {openMenuId === student.id ? (
                <div className="absolute right-4 top-11 z-20 w-44 rounded-2xl border border-slate-100 bg-white p-2 text-sm shadow-lg">
                  {canEditStudent ? (
                    <button
                      onClick={() => {
                        onOpenModal("editStudent", { student });
                        setOpenMenuId(null);
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-slate-600 transition hover:bg-slate-50"
                    >
                      <LucideIcon name="UserSquare" className="h-4 w-4" />
                      View / Edit
                    </button>
                  ) : null}
                  {canLogPayment ? (
                    <button
                      onClick={() => {
                        onOpenModal("logPayment", { student });
                        setOpenMenuId(null);
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-slate-600 transition hover:bg-slate-50"
                    >
                      <LucideIcon name="CreditCard" className="h-4 w-4" />
                      Log Payment
                    </button>
                  ) : null}
                  {canToggleStatus ? (
                    <button
                      onClick={() => {
                        onToggleActive(student.id);
                        setOpenMenuId(null);
                      }}
                      disabled={busy}
                      className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                      <LucideIcon name="Power" className="h-4 w-4" />
                      {student.is_active ? "Deactivate" : "Activate"}
                    </button>
                  ) : null}
                </div>
              ) : null}
            </>
          ) : (
            <span className="text-xs text-slate-400">No permissions</span>
          )}
        </td>
      </tr>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-slate-900">
              Student Management
            </h1>
            <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {students.length} total
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Manage KYC, plans, seats, and billing for every reader.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canCreateStudent ? (
            <button
              onClick={() => onOpenModal("createStudent")}
              className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
            >
              <LucideIcon name="userPlus" className="h-3.5 w-3.5" />
              New Student
            </button>
          ) : null}
          <button
            onClick={() => onNavigate("admissions")}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3.5 py-2 text-sm font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-white"
          >
            <LucideIcon name="qrCode" className="h-3.5 w-3.5" />
            QR Enroll
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            title: "Active",
            value: summary.active,
            tone: "bg-emerald-50 text-emerald-600",
            icon: "badgeCheck",
          },
          {
            title: "Monthly Plans",
            value: summary.monthly,
            tone: "bg-indigo-50 text-indigo-600",
            icon: "calendarDays",
          },
          {
            title: "Limited Plans",
            value: summary.limited,
            tone: "bg-amber-50 text-amber-600",
            icon: "disc",
          },
          {
            title: "Reg. Pending",
            value: summary.registrationsPending,
            tone: "bg-rose-50 text-rose-600",
            icon: "alertCircle",
          },
        ].map((chip) => (
          <div
            key={chip.title}
            className={`flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-3 ${chip.tone}`}
          >
            <div>
              <p className="text-xs uppercase tracking-wide">{chip.title}</p>
              <p className="text-2xl font-semibold">{chip.value}</p>
            </div>
            <LucideIcon name={chip.icon} className="h-5 w-5" />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white/95 p-5 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 gap-3">
            <div className="relative w-full sm:max-w-xs">
              <LucideIcon
                name="search"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name, Aadhaar, or phone…"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <select
              value={planFilter}
              onChange={(event) => setPlanFilter(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 sm:w-40"
            >
              <option value="all">All Plans</option>
              <option value="monthly">Monthly Cycle</option>
              <option value="limited">Limited Days</option>
            </select>
          </div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            {filtered.length} students
          </p>
        </div>

        <section className="space-y-4 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Active Students
              </p>
              <p className="text-xs text-slate-500">
                Showing only currently active learners.
              </p>
            </div>
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {activeOnly.length} active
            </span>
          </div>
          <div
            className="overflow-x-auto rounded-2xl border border-slate-100"
            style={{ scrollbarWidth: "thin" }}
          >
            <table className="min-w-[1100px] w-full table-auto divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">Student</th>
                  <th className="px-4 py-3 text-left">Contact</th>
                  <th className="px-4 py-3 text-left">Plan</th>
                  <th className="px-4 py-3 text-left">Seat</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Payments</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeOnly.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-6 text-center text-sm text-slate-500"
                    >
                      No active students match the current filters.
                    </td>
                  </tr>
                ) : (
                  activeOnly.map((student, index) => renderRow(student, index, 0))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-4 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                All Students
              </p>
              <p className="text-xs text-slate-500">
                Includes both active and inactive records.
              </p>
            </div>
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {filtered.length} total
            </span>
          </div>
          <div
            className="overflow-x-auto rounded-2xl border border-slate-100"
            style={{ scrollbarWidth: "thin" }}
          >
            <table className="min-w-[1100px] w-full table-auto divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">Student</th>
                  <th className="px-4 py-3 text-left">Contact</th>
                  <th className="px-4 py-3 text-left">Plan</th>
                  <th className="px-4 py-3 text-left">Seat</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Payments</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedStudents.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-6 text-center text-sm text-slate-500"
                    >
                      No students match the current filters.
                    </td>
                  </tr>
                ) : (
                  paginatedStudents.map((student, index) =>
                    renderRow(student, index, (page - 1) * PAGE_SIZE)
                  )
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-2 rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Showing {(page - 1) * PAGE_SIZE + (paginatedStudents.length ? 1 : 0)}-
              {(page - 1) * PAGE_SIZE + paginatedStudents.length} of {filtered.length} students
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold transition hover:border-indigo-200 disabled:opacity-40"
              >
                Prev
              </button>
              <span className="text-xs font-semibold text-slate-500">
                Page {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold transition hover:border-indigo-200 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default StudentsView;
