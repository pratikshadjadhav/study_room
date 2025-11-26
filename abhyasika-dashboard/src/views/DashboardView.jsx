import React, { useMemo } from "react";
import StatCard from "../components/common/StatCard.jsx";
import LucideIcon from "../components/icons/LucideIcon.jsx";

function DashboardView({ students, seats, payments }) {
  const today = new Date();
  const weekAhead = new Date();
  weekAhead.setDate(weekAhead.getDate() + 7);

  const metrics = useMemo(() => {
    const active = students.filter((student) => student.is_active);
    const monthly = active.filter(
      (student) => student.fee_plan_type === "monthly"
    );
    const limited = active.filter(
      (student) => student.fee_plan_type === "limited"
    );
    const regPending = students.filter((student) => !student.registration_paid);
    const renewalsDue = students.filter((student) => {
      if (!student.renewal_date) return false;
      const renewal = new Date(student.renewal_date);
      return renewal >= today && renewal <= weekAhead;
    });
    const occupiedSeats = seats.filter((seat) => seat.status === "occupied");
    const availableSeats = seats.filter((seat) => seat.status === "available");
    const maintenanceSeats = seats.filter(
      (seat) => seat.status === "maintenance"
    );
    const recentPayments = [...payments]
      .sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date))
      .slice(0, 5);

    const revenueTrend = Array.from({ length: 7 }).map((_, idx) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - idx));
      const label = date.toLocaleDateString("en-IN", {
        weekday: "short",
      });
      const dayTotal = payments
        .filter(
          (payment) =>
            payment.payment_date.slice(0, 10) ===
            date.toISOString().slice(0, 10)
        )
        .reduce((sum, payment) => sum + payment.amount_paid, 0);
      return { label, total: dayTotal };
    });

    const notifications = [];

    renewalsDue.slice(0, 4).forEach((student) => {
      notifications.push({
        id: `renewal-${student.id}`,
        title: "Renewal reminder",
        message: `${student.name} due on ${new Date(
          student.renewal_date
        ).toLocaleDateString()}`,
        type: "warning",
      });
    });

    recentPayments.forEach((payment) => {
      notifications.push({
        id: `payment-${payment.id}`,
        title: "Payment received",
        message: `₹${Number(payment.amount_paid || 0).toLocaleString(
          "en-IN"
        )} via ${payment.payment_mode === "upi" ? "UPI" : "Cash"}`,
        type: "success",
      });
    });

    regPending.slice(0, 3).forEach((student) => {
      notifications.push({
        id: `reg-${student.id}`,
        title: "Registration pending",
        message: `${student.name} has not paid registration fee.`,
        type: "alert",
      });
    });

    maintenanceSeats.slice(0, 3).forEach((seat) => {
      notifications.push({
        id: `seat-${seat.id}`,
        title: "Seat in maintenance",
        message: `${seat.seat_number} requires attention.`,
        type: "info",
      });
    });

    students
      .filter((student) => student.registration_source === "qr_self")
      .filter((student) => {
        if (!student.join_date) return true;
        const join = new Date(student.join_date);
        return (today - join) / (1000 * 60 * 60 * 24) <= 7;
      })
      .slice(0, 3)
      .forEach((student) => {
        notifications.push({
          id: `qr-${student.id}`,
          title: "New QR enrollment",
          message: `${student.name} submitted via QR`,
          type: "info",
        });
      });

    return {
      active,
      monthly,
      limited,
      regPending,
      renewalsDue,
      occupiedSeats,
      availableSeats,
      maintenanceSeats,
      recentPayments,
      revenueTrend,
      notifications: notifications.slice(0, 6),
    };
  }, [students, seats, payments]);

  const studentMap = useMemo(() => {
    const map = new Map();
    students.forEach((student) => map.set(student.id, student));
    return map;
  }, [students]);

  const formatDate = (value) =>
    value ? new Date(value).toLocaleDateString() : "—";

  const notificationTone = (type) => {
    switch (type) {
      case "success":
        return "border-emerald-100 bg-emerald-50 text-emerald-700";
      case "warning":
        return "border-amber-100 bg-amber-50 text-amber-700";
      case "alert":
        return "border-rose-100 bg-rose-50 text-rose-700";
      default:
        return "border-slate-100 bg-slate-50 text-slate-700";
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Active Students"
          icon="users"
          value={metrics.active.length}
          subtext="Engaged learners"
          tone="primary"
        />
        <StatCard
          title="Seats Occupied"
          icon="armchair"
          value={metrics.occupiedSeats.length}
          subtext={`${metrics.availableSeats.length} available`}
          tone="success"
        />
        <StatCard
          title="Monthly vs Limited"
          icon="calendarDays"
          value={`${metrics.monthly.length} / ${metrics.limited.length}`}
          subtext="Monthly / Limited"
        />
        <StatCard
          title="Reg. Pending"
          icon="alertCircle"
          value={metrics.regPending.length}
          subtext="Collect enrollment fees"
          tone="warning"
        />
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white/90 p-5 shadow-sm backdrop-blur">
        <p className="text-sm font-semibold text-slate-900">Snapshot</p>
        <div className="mt-3 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Rolling Plans
            </p>
            <p className="text-xl font-semibold text-slate-900">
              {
                metrics.active.filter(
                  (student) => student.fee_cycle === "rolling"
                ).length
              }
            </p>
            <p className="text-xs text-slate-500">
              Students billed 30 days from join date
            </p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Limited Pass Avg.
            </p>
            <p className="text-xl font-semibold text-slate-900">
              {metrics.limited.length
                ? `${Math.round(
                    metrics.limited.reduce(
                      (sum, item) => sum + (item.limited_days || 0),
                      0
                    ) / metrics.limited.length
                  )} days`
                : "—"}
            </p>
            <p className="text-xs text-slate-500">
              Average duration for limited category
            </p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Renewals This Week
            </p>
            <p className="text-xl font-semibold text-slate-900">
              {metrics.renewalsDue.length}
            </p>
            <p className="text-xs text-slate-500">
              Follow up with these learners proactively
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white/90 p-5 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              7-Day Revenue Trend
            </p>
            <p className="text-xs text-slate-500">
              Real-time intake from UPI and cash collections
            </p>
          </div>
          <span className="text-sm font-semibold text-slate-900">
            Total ₹
            {metrics.revenueTrend
              .reduce((sum, day) => sum + day.total, 0)
              .toLocaleString("en-IN")}
          </span>
        </div>
        <div className="mt-6 flex items-end gap-4">
          {metrics.revenueTrend.map((day) => {
            const max = Math.max(
              ...metrics.revenueTrend.map((item) => item.total),
              1
            );
            const height = (day.total / max) * 160 + 8;
            return (
              <div key={day.label} className="flex flex-1 flex-col items-center gap-2">
                <div className="text-xs font-semibold text-slate-500">
                  ₹{day.total.toLocaleString("en-IN")}
                </div>
                <div
                  className="w-10 rounded-2xl bg-gradient-to-t from-indigo-200 via-indigo-400 to-indigo-600 shadow"
                  style={{ height }}
                />
                <p className="text-xs font-semibold text-slate-500">
                  {day.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-100/80 bg-white/95 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h3 className="text-base font-semibold text-slate-900">
              Upcoming Renewals
            </h3>
            <span className="text-sm font-medium text-indigo-600">
              {metrics.renewalsDue.length} due
            </span>
          </div>
          <div className="divide-y divide-slate-100">
            {metrics.renewalsDue.length === 0 ? (
              <p className="px-5 py-6 text-sm text-slate-500">
                No renewals due in the next 7 days.
              </p>
            ) : (
              metrics.renewalsDue
                .sort(
                  (a, b) => new Date(a.renewal_date) - new Date(b.renewal_date)
                )
                .map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between px-5 py-4"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {student.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {student.fee_plan_type === "limited"
                          ? `${student.limited_days || 0} day pass`
                          : student.fee_cycle === "rolling"
                          ? "Monthly rolling"
                          : "Calendar cycle"}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-slate-700">
                      {formatDate(student.renewal_date)}
                    </span>
                  </div>
                ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100/80 bg-white/95 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h3 className="text-base font-semibold text-slate-900">
              Recent Payments
            </h3>
            <span className="text-sm font-medium text-indigo-600">
              Last 5
            </span>
          </div>
          <div className="divide-y divide-slate-100">
            {metrics.recentPayments.length === 0 ? (
              <p className="px-5 py-6 text-sm text-slate-500">
                No payments recorded yet.
              </p>
            ) : (
              metrics.recentPayments.map((payment) => {
                const student = studentMap.get(payment.student_id);
                return (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between px-5 py-4"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {student ? student.name : "Unknown student"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {payment.payment_mode === "upi" ? "UPI" : "Cash"} •{" "}
                        {new Date(payment.payment_date).toLocaleString()}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-emerald-600">
                      ₹{payment.amount_paid.toLocaleString("en-IN")}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100/80 bg-white/95 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h3 className="text-base font-semibold text-slate-900">
              Notifications
            </h3>
            <span className="text-sm font-medium text-indigo-600">
              {metrics.notifications.length} alerts
            </span>
          </div>
          <div className="divide-y divide-slate-100">
            {metrics.notifications.length === 0 ? (
              <p className="px-5 py-6 text-sm text-slate-500">
                Everything looks good. No alerts at the moment.
              </p>
            ) : (
              metrics.notifications.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between px-5 py-4 text-sm ${notificationTone(
                    item.type
                  )}`}
                >
                  <div>
                    <p className="font-semibold">{item.title}</p>
                    <p className="text-xs opacity-80">{item.message}</p>
                  </div>
                  <LucideIcon
                    name={
                      item.type === "success"
                        ? "badgeCheck"
                        : item.type === "warning"
                        ? "bell"
                        : item.type === "alert"
                        ? "alertTriangle"
                        : "info"
                    }
                    className="h-4 w-4 opacity-70"
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardView;

