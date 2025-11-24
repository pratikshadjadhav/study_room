import React from "react";

function LoadingState({ message = "Loading dashboard…" }) {
  return (
    <div className="flex h-full flex-1 items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
        <p className="text-sm font-medium text-slate-500">{message}</p>
      </div>
    </div>
  );
}

export default LoadingState;

