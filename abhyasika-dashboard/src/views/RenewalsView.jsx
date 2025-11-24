import React, { useMemo } from "react";
import LucideIcon from "../components/icons/LucideIcon.jsx";
import { useAuth } from "../context/AuthContext.jsx";

function RenewalsView({ students, plans = [], onOpenModal }) {
  const { hasPermission } = useAuth();
  const canLogPayment = hasPermission("payments", "add");

  const planMap = useMemo(() => {
    const map = new Map();
    plans.forEach((plan) => map.set(plan.id, plan));
    return map;
  }, [plans]);

  const today = new Date();
  const upcomingWindow = 7;

  const { upcoming, overdue, noPlan } = useMemo(() => {
    const bucket = {
      upcoming: [],
      overdue: [],
      noPlan: [],
    };
    students.forEach((student) => {
      if (!student.renewal_date) {
        bucket.noPlan.push(student);
        return;
      }
      const due = new Date(student.renewal_date);
      const diffDays = Math.floor(
        (due.setHours(0, 0, 0, 0) - today.setHours(0, 0, 0, 0)) /
          (1000 * 60 * 60 * 24)
      );
      if (diffDays < 0) {
        bucket.overdue.push(student);
      } else if (diffDays <= upcomingWindow) {
        bucket.upcoming.push(student);
      }
    });
    bucket.upcoming.sort(
      (a, b) =>
        new Date(a.renewal_date).getTime() - new Date(b.renewal_date).getTime()
    );
    bucket.overdue.sort(
      (a, b) =>
        new Date(a.renewal_date).getTime() - new Date(b.renewal_date).getTime()
    );
    bucket.noPlan.sort((a, b) => a.name.localeCompare(b.name));
    return bucket;
  }, [students, upcomingWindow, today]);

  const summaryCards = [
    {
      label: "Due this week",
      value: upcoming.length,
      tone: "bg-amber-50 text-amber-600",
      icon: "CalendarCheck",
    },
    {
      label: "Past due",
      value: overdue.length,
      tone: "bg-rose-50 text-rose-600",
      icon: "AlertTriangle",
    },
    {
      label: "No plan set",
      value: noPlan.length,
      tone: "bg-slate-50 text-slate-600",
      icon: "CircleHelp",
    },
  ];

  const rows = [
    ...overdue.map((student) => ({
      student,
      status: "Overdue",
      tone: "text-rose-600",
    })),
    ...upcoming.map((student) => ({
      student,
      status: "Due soon",
      tone: "text-amber-600",
    })),
    ...noPlan.map((student) => ({
      student,
      status: "No plan",
      tone: "text-slate-500",
    })),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-slate-900">Renewals</h1>
        <p className="text-sm text-slate-500">
          Monitor upcoming expiries and take action proactively.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className={`rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  {card.label}
                </p>
                <p className="text-2xl font-semibold text-slate-900">
                  {card.value}
                </p>
              </div>
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-2xl ${card.tone}`}
              >
                <LucideIcon name={card.icon} className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white shadow-sm">
        <div className="overflow-x-auto rounded-3xl">
          <table className="min-w-[900px] w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-slate-500">
                  Student
                </th>
                <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-slate-500">
                  Plan
                </th>
                <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-slate-500">
                  Renewal Date
                </th>
                <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>
                <th className="px-4 py-3 text-right font-semibold uppercase tracking-wide text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-sm text-slate-500"
                  >
                    All renewals look good. Great job!
                  </td>
                </tr>
              ) : (
                rows.map(({ student, status, tone }) => {
                  const plan = planMap.get(student.current_plan_id);
                  return (
                    <tr key={student.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-600">
                            {student.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p>{student.name}</p>
                            <p className="text-xs text-slate-500">
                              {student.phone || student.email || "No contact"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {plan ? plan.name : "Not set"}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {student.renewal_date
                          ? new Date(student.renewal_date).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className={`px-4 py-3 text-sm font-semibold ${tone}`}>
                        {status}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-slate-600">
                        {canLogPayment ? (
                          <button
                            onClick={() =>
                              onOpenModal("logPayment", { student })
                            }
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600"
                          >
                            <LucideIcon name="CreditCard" className="h-3.5 w-3.5" />
                            Log Payment
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">
                            No action
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default RenewalsView;
