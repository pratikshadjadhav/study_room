import React from "react";
import LucideIcon from "../icons/LucideIcon.jsx";

const toneStyles = {
  default: "bg-white border-slate-100 dark:border-gray-700 dark:bg-gray-800/90",
  primary:
    "bg-indigo-50 border-indigo-100 dark:border-indigo-500/40 dark:bg-indigo-500/10",
  success:
    "bg-emerald-50 border-emerald-100 dark:border-emerald-500/40 dark:bg-emerald-500/10",
  warning:
    "bg-amber-50 border-amber-100 dark:border-amber-500/40 dark:bg-amber-500/10",
};

const toneGradients = {
  default: "from-indigo-200/40 to-pink-200/40",
  primary: "from-indigo-300/60 to-sky-200/40",
  success: "from-emerald-300/60 to-lime-200/30",
  warning: "from-amber-300/60 to-orange-200/40",
};

function StatCard({ title, icon, value, subtext, tone = "default" }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${
        toneStyles[tone] ?? toneStyles.default
      }`}
    >
      <div
        className={`pointer-events-none absolute inset-y-0 right-0 w-32 translate-x-8 bg-gradient-to-br ${
          toneGradients[tone] ?? toneGradients.default
        } opacity-70 blur-3xl`}
      />
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 transition-colors dark:text-slate-300">
            {title}
          </p>
          <p className="mt-2 text-3xl font-semibold text-slate-900 transition-colors dark:text-white">
            {value}
          </p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-inner transition-colors dark:bg-gray-900">
          <LucideIcon
            name={icon}
            className="h-6 w-6 text-indigo-600 transition-colors dark:text-indigo-200"
          />
        </div>
      </div>
      {subtext ? (
        <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-400 transition-colors dark:text-slate-500">
          {subtext}
        </p>
      ) : null}
    </div>
  );
}

export default StatCard;
