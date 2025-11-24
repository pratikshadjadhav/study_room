import React, { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import LucideIcon from "../components/icons/LucideIcon.jsx";
import LoadingState from "../components/common/LoadingState.jsx";

function LoginView() {
  const { login, authLoading, authError, authInitializing } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [localError, setLocalError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLocalError("");
    try {
      await login(form.email.trim(), form.password);
    } catch (loginError) {
      setLocalError(loginError.message);
    }
  };

  if (authInitializing) {
    return <LoadingState message="Checking session…" />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-12">
      <div className="w-full max-w-md space-y-6 rounded-3xl bg-white p-8 shadow-xl ring-1 ring-slate-900/10">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow">
            <span className="text-2xl font-semibold">A</span>
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Admin Sign In
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Access the Abhyasika dashboard with your admin credentials.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="flex flex-col text-sm font-medium text-slate-700">
            Email
            <input
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              required
              className="mt-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              placeholder="you@example.com"
            />
          </label>
          <label className="flex flex-col text-sm font-medium text-slate-700">
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={handleChange}
              required
              className="mt-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              placeholder="Your password"
            />
          </label>

          {authError || localError ? (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              <LucideIcon name="alertCircle" className="h-4 w-4" />
              <span>{localError || authError}</span>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={authLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-indigo-500 disabled:bg-indigo-300"
          >
            {authLoading ? (
              <>
                <LucideIcon
                  name="loader2"
                  className="h-4 w-4 animate-spin"
                />
                Signing in…
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginView;
