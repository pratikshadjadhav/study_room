import React from "react";
import LucideIcon from "../icons/LucideIcon.jsx";

function ErrorBanner({ message }) {
  if (!message) return null;

  return (
    <div className="mb-4 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      <LucideIcon name="alertCircle" className="h-5 w-5" />
      <span>{message}</span>
    </div>
  );
}

export default ErrorBanner;

