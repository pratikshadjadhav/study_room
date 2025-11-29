import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import LucideIcon from "../components/icons/LucideIcon.jsx";

function AdmissionsView() {
  // Paste your live enrollment form URL here (Supabase Edge, Typeform, Google Form, etc.).
  const [enrollUrl, setEnrollUrl] = useState(
    "http://localhost:5173/onboarding"
  );
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (!enrollUrl || !enrollUrl.startsWith("http")) {
      setQrDataUrl("");
      return;
    }
    QRCode.toDataURL(enrollUrl, { margin: 1 })
      .then((url) => {
        if (mounted) setQrDataUrl(url);
      })
      .catch(() => setQrDataUrl(""));
    return () => {
      mounted = false;
    };
  }, [enrollUrl]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(enrollUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-100 dark:border-gray-800 bg-gradient-to-r from-indigo-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide text-indigo-500 dark:text-indigo-300">
              Smart Admissions
            </p>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              QR Enrollment Portal
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">
              Display this QR inside the study room so students can self-enroll
              with Aadhaar and contact details.
            </p>
          </div>
          <button
            onClick={handleCopy}
            disabled={!enrollUrl || !enrollUrl.startsWith("http")}
            className="inline-flex items-center gap-2 rounded-2xl border border-indigo-200 bg-white dark:bg-gray-900/80 px-4 py-2 text-sm font-semibold text-indigo-600 shadow-sm transition hover:border-indigo-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <LucideIcon name="copy" className="h-4 w-4" />
            {copied ? "Copied!" : "Copy URL"}
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-slate-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
          <label className="flex flex-col text-sm font-medium text-slate-700 dark:text-slate-200">
            Enrollment URL
            <input
              value={enrollUrl}
              onChange={(event) => setEnrollUrl(event.target.value)}
              placeholder="https://yourdomain.com/enroll"
              className="mt-1 rounded-xl border border-slate-200 dark:border-gray-700 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </label>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500">
            Point this to your live Supabase / Typeform / Google Form that
            collects student data.
          </p>
          <p className="text-xs text-amber-600">
            Tip: Use your Supabase Edge Function URL to post directly into the students table.
          </p>

          <div className="mt-5 rounded-2xl border border-dashed border-slate-200 dark:border-gray-700 p-4">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Welcome Instructions
            </p>
            <ul className="mt-2 list-inside list-disc text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500">
              <li>Students scan QR to register and upload Aadhaar + photo.</li>
              <li>Admin receives notification to review and approve.</li>
              <li>
                Seat allotment + payment collection happen inside this dashboard.
              </li>
            </ul>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 text-center shadow-sm">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="Enrollment QR"
              className="mx-auto h-64 w-64 rounded-3xl border border-slate-100 dark:border-gray-800 p-4 shadow-inner"
            />
          ) : (
            <div className="flex h-64 items-center justify-center rounded-3xl border border-dashed border-slate-200 dark:border-gray-700 px-4 text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">
              <div className="text-center">
                <p className="font-semibold text-slate-700 dark:text-slate-200">
                  Add a valid URL to generate the QR
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500">
                  Paste your live enrollment form link above. The QR will update instantly.
                </p>
              </div>
            </div>
          )}
          <p className="mt-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
            Display-ready QR
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500">
            Print and place near the front desk or waiting area.
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
            <LucideIcon name="listCheck" className="h-5 w-5" />
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Quick Admission Checklist
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">
              Use this when converting QR leads to active students.
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {[
            "Verify Aadhaar and face photo at the desk.",
            "Collect registration fee (mark in student profile).",
            "Assign seat + locker (Seat Manager).",
            "Choose plan type (monthly / limited) and log first payment.",
          ].map((item) => (
            <div
              key={item}
              className="flex items-center gap-3 rounded-2xl border border-slate-100 dark:border-gray-800 bg-slate-50 dark:bg-gray-900/60 px-4 py-3 text-sm text-slate-600 dark:text-slate-300"
            >
              <LucideIcon name="check" className="h-4 w-4 text-emerald-500" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdmissionsView;
