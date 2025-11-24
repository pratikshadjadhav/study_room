import React, { useEffect } from "react";
import LucideIcon from "../icons/LucideIcon.jsx";

function Toast({ message, onClear, tone = "success" }) {
  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(onClear, 3200);
    return () => clearTimeout(timer);
  }, [message, onClear]);

  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[60]">
      <div className="flex items-center gap-3 rounded-xl bg-slate-900/90 px-4 py-3 text-sm font-medium text-white shadow-lg">
        <LucideIcon
          name={tone === "success" ? "badgeCheck" : "alertCircle"}
          className={`h-4 w-4 ${
            tone === "success" ? "text-emerald-400" : "text-amber-300"
          }`}
        />
        <span>{message}</span>
      </div>
    </div>
  );
}

export default Toast;

