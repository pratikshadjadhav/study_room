import React, { useEffect, useMemo, useState } from "react";
import Modal from "../common/Modal.jsx";
import LucideIcon from "../icons/LucideIcon.jsx";
import { supabase } from "../../lib/supabaseBrowser.js";

const FEE_PLAN_OPTIONS = [
  { value: "monthly", label: "Monthly Membership" },
  { value: "limited", label: "Limited Days" },
];

const FEE_CYCLES = [
  { value: "calendar", label: "1st - 30th" },
  { value: "rolling", label: "Rolling 30 days" },
];

const SHIFTS = ["Morning", "Afternoon", "Evening", "Day"];
const GENDERS = ["Male", "Female", "Other"];

const PHOTO_BUCKET = "aadhar_pan";

function StudentModal({ open, onClose, onSubmit, student, plans, seats }) {
  const isEdit = Boolean(student);
  const [form, setForm] = useState(() => ({
    name: student?.name ?? "",
    phone: student?.phone ?? "",
    email: student?.email ?? "",
    gender: student?.gender ?? "",
    aadhaar: student?.aadhaar ?? "",
    pan_card: student?.pan_card ?? "",
    address: student?.address ?? "",
    city: student?.city ?? "",
    state: student?.state ?? "",
    pincode: student?.pincode ?? "",
    attach_aadhaar_photo: false,
    aadhaar_photo: null,
    preferred_shift: student?.preferred_shift ?? "Morning",
    fee_plan_type: student?.fee_plan_type ?? "monthly",
    fee_cycle: student?.fee_cycle ?? "calendar",
    limited_days: student?.limited_days ?? "",
    registration_paid: student?.registration_paid ?? false,
    join_date: student?.join_date ?? new Date().toISOString().slice(0, 10),
    current_plan_id: student?.current_plan_id ?? "",
    renewal_date: student?.renewal_date ?? "",
    is_active: student?.is_active ?? true,
    initialPayment: {
      enabled: false,
      plan_id: student?.current_plan_id ?? plans?.[0]?.id ?? "",
      amount_paid: "",
      payment_mode: "upi",
      valid_from: new Date().toISOString().slice(0, 10),
      valid_until: new Date().toISOString().slice(0, 10),
      includes_registration: false,
      notes: "",
    },
  }));
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const assignedSeat = useMemo(
    () => seats.find((seat) => seat.id === student?.current_seat_id),
    [seats, student?.current_seat_id]
  );

  useEffect(() => {
    let active = true;
    async function loadHistory() {
      if (!open || !student?.id) {
        if (active) {
          setHistory([]);
          setHistoryLoading(false);
        }
        return;
      }
      setHistoryLoading(true);
      const { data, error } = await supabase
        .from("audit_log")
        .select("*")
        .eq("object_type", "students")
        .eq("object_id", student.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (!active) return;
      if (!error) {
        setHistory(data ?? []);
      } else {
        console.warn("Student history load failed", error.message);
        setHistory([]);
      }
      setHistoryLoading(false);
    }
    loadHistory();
    return () => {
      active = false;
    };
  }, [open, student?.id]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    let nextValue = type === "checkbox" ? checked : value;
    if (name === "pan_card") {
      nextValue = value.toUpperCase();
    }
    setForm((prev) => ({
      ...prev,
      [name]: nextValue,
    }));
  };

  const feeSummary =
    form.fee_plan_type === "limited"
      ? `${form.limited_days || "—"} days`
      : form.fee_cycle === "rolling"
      ? "Rolling 30 days"
      : "Calendar month";

  const uploadAadhaarPhoto = async (file, existingPath = null) => {
    if (!file) return existingPath;

    const extension = file.name?.split(".").pop() || "jpg";
    const uniqueId =
      (typeof crypto !== "undefined" && crypto.randomUUID?.()) ||
      `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const path =
      existingPath && existingPath.startsWith("students/")
        ? existingPath
        : `students/${uniqueId}.${extension}`;

    console.log("Uploading photo to:", PHOTO_BUCKET, path);

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(PHOTO_BUCKET)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      throw new Error(uploadError.message ?? "Unable to upload Aadhaar photo. Please check if the storage bucket exists and you have upload permissions.");
    }

    console.log("Photo uploaded successfully:", uploadData);

    // Generate public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from(PHOTO_BUCKET)
      .getPublicUrl(path);

    if (!urlData?.publicUrl) {
      console.warn("Could not generate public URL for uploaded photo. Returning path only.");
    } else {
      console.log("Public URL generated:", urlData.publicUrl);
    }

    return path;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const phoneDigits = form.phone.replace(/\D/g, "");
    const phoneRegex = /^\d{10}$/;
    const emailRegex = /.+@.+\..+/;
    const aadhaarDigits = form.aadhaar.replace(/\D/g, "");
    const panRegex = /^[A-Z]{5}\d{4}[A-Z]$/;
    const pincodeRegex = /^\d{6}$/;

    if (!form.name.trim()) {
      alert("Name is required.");
      return;
    }
    if (!phoneRegex.test(phoneDigits)) {
      alert("Phone must be a 10 digit number.");
      return;
    }
    if (form.email && !emailRegex.test(form.email.trim())) {
      alert("Enter a valid email address.");
      return;
    }
    if (!form.gender) {
      alert("Gender selection is required.");
      return;
    }
    if (aadhaarDigits.length !== 12) {
      alert("Aadhaar must be a 12 digit number (digits only).");
      return;
    }
    if (!panRegex.test(form.pan_card.trim().toUpperCase())) {
      alert("PAN must be 10 characters (e.g., ABCDE1234F).");
      return;
    }
    if (!form.address.trim()) {
      alert("Address is required.");
      return;
    }
    if (!form.city.trim()) {
      alert("City is required.");
      return;
    }
    if (!form.state.trim()) {
      alert("State is required.");
      return;
    }
    if (!pincodeRegex.test(form.pincode.trim())) {
      alert("Pincode must be a 6 digit number.");
      return;
    }
    if (form.attach_aadhaar_photo) {
      if (!form.aadhaar_photo) {
        alert("Please attach an Aadhaar photo file.");
        return;
      }
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!allowedTypes.includes(form.aadhaar_photo.type)) {
        alert("Aadhaar photo must be JPEG, PNG, or WEBP.");
        return;
      }
      const maxSizeMb = 2;
      if (form.aadhaar_photo.size > maxSizeMb * 1024 * 1024) {
        alert(`Aadhaar photo must be under ${maxSizeMb} MB.`);
        return;
      }
    }
    let photoPath = student?.photo_url ?? null;
    if (form.attach_aadhaar_photo && form.aadhaar_photo) {
      try {
        photoPath = await uploadAadhaarPhoto(form.aadhaar_photo, student?.photo_url);
      } catch (uploadErr) {
        alert(uploadErr?.message ?? "Failed to upload Aadhaar photo.");
        return;
      }
    }

    const payload = {
      name: form.name.trim(),
      phone: phoneDigits,
      email: form.email.trim() || null,
      gender: form.gender,
      aadhaar: aadhaarDigits,
      pan_card: form.pan_card.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      pincode: form.pincode.trim(),
      preferred_shift: form.preferred_shift,
      fee_plan_type: form.fee_plan_type,
      fee_cycle: form.fee_cycle,
      limited_days:
        form.fee_plan_type === "limited"
          ? Number(form.limited_days) || null
          : null,
      registration_paid: form.registration_paid,
      join_date: form.join_date,
      photo_url: photoPath,
      initialPayment: form.initialPayment,
    };

    if (isEdit) {
      payload.current_plan_id = form.current_plan_id || null;
      payload.renewal_date = form.renewal_date || null;
      payload.is_active = form.is_active;
    }

    onSubmit(payload);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "View / Edit Student" : "Create New Student"}
      maxWidth="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col text-sm font-medium text-slate-700">
            Full Name
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              placeholder="Enter full name"
              required
            />
          </label>
          <label className="flex flex-col text-sm font-medium text-slate-700">
            Phone Number
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              placeholder="Contact number"
            />
          </label>
          <label className="flex flex-col text-sm font-medium text-slate-700">
            Email
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              placeholder="Email address"
            />
          </label>
          <label className="flex flex-col text-sm font-medium text-slate-700">
            Gender
            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
              className="mt-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              required
            >
              <option value="">Select</option>
              {GENDERS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col text-sm font-medium text-slate-700">
            Aadhaar Number
            <input
              name="aadhaar"
              value={form.aadhaar}
              onChange={handleChange}
              maxLength={14}
              className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              placeholder="1234 5678 9012"
              required
            />
          </label>
          <label className="flex flex-col text-sm font-medium text-slate-700">
            PAN Card Number
            <input
              name="pan_card"
              value={form.pan_card}
              onChange={handleChange}
              maxLength={10}
              className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 uppercase tracking-wide outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              placeholder="ABCDE1234F"
              required
            />
          </label>
          <label className="flex flex-col text-sm font-medium text-slate-700 md:col-span-2">
            Address
            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              rows={3}
              className="mt-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              placeholder="Flat / Street / Landmark"
              required
            />
          </label>
          <label className="flex flex-col text-sm font-medium text-slate-700">
            City
            <input
              name="city"
              value={form.city}
              onChange={handleChange}
              className="mt-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              placeholder="City"
              required
            />
          </label>
        
          <label className="flex flex-col text-sm font-medium text-slate-700">
            State
            <input
              name="state"
              value={form.state}
              onChange={handleChange}
              className="mt-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              placeholder="State"
              required
            />
          </label>
          <label className="flex flex-col text-sm font-medium text-slate-700">
            Pincode
            <input
              name="pincode"
              value={form.pincode}
              onChange={handleChange}
              className="mt-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              placeholder="6-digit pin"
              maxLength={10}
              required
            />
          </label>
            <div className="flex flex-col gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-3 md:col-span-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">
                Attach Aadhaar photo (JPEG/PNG/WEBP, under 2 MB)
              </p>
              <button
                type="button"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    attach_aadhaar_photo: !prev.attach_aadhaar_photo,
                    aadhaar_photo: !prev.attach_aadhaar_photo ? prev.aadhaar_photo : null,
                  }))
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                  form.attach_aadhaar_photo ? "bg-indigo-600" : "bg-slate-300"
                }`}
                aria-pressed={form.attach_aadhaar_photo}
              >
                <span
                  className={`inline-block h-5 w-5 rounded-full bg-white shadow transition ${
                    form.attach_aadhaar_photo ? "translate-x-5" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
            {form.attach_aadhaar_photo ? (
              <div className="flex flex-col gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:border-indigo-300 transition">
                  <LucideIcon name="Upload" className="h-4 w-4" />
                  <span>
                    {form.aadhaar_photo ? form.aadhaar_photo.name : "Choose file"}
                  </span>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      setForm((prev) => ({
                        ...prev,
                        aadhaar_photo: file || null,
                      }));
                    }}
                    className="hidden"
                  />
                </label>
                {form.aadhaar_photo && (
                  <div className="relative rounded-xl border border-slate-200 overflow-hidden">
                    <img
                      src={URL.createObjectURL(form.aadhaar_photo)}
                      alt="Aadhaar preview"
                      className="w-full h-32 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, aadhaar_photo: null }))}
                      className="absolute top-2 right-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600 transition"
                      aria-label="Remove photo"
                    >
                      <LucideIcon name="X" className="h-4 w-4" />
                    </button>
                  </div>
                )}
                <p className="text-xs text-slate-500">
                  Upload JPEG, PNG, or WEBP under 2 MB.
                </p>
              </div>
            ) : null}
          </div>
          <label className="flex flex-col text-sm font-medium text-slate-700">
            Preferred Shift
            <select
              name="preferred_shift"
              value={form.preferred_shift}
              onChange={handleChange}
              className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            >
              {SHIFTS.map((shift) => (
                <option key={shift} value={shift}>
                  {shift}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
          <p className="text-sm font-semibold text-slate-700">Fee Structure</p>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <label className="flex flex-col text-sm font-medium text-slate-700">
              Plan Type
              <select
                name="fee_plan_type"
                value={form.fee_plan_type}
                onChange={handleChange}
                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              >
                {FEE_PLAN_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col text-sm font-medium text-slate-700">
              Billing Cycle
              <select
                name="fee_cycle"
                value={form.fee_cycle}
                onChange={handleChange}
                disabled={form.fee_plan_type === "limited"}
                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
              >
                {FEE_CYCLES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            {form.fee_plan_type === "limited" ? (
              <label className="flex flex-col text-sm font-medium text-slate-700">
                Number of Days
                <input
                  name="limited_days"
                  type="number"
                  min="1"
                  value={form.limited_days}
                  onChange={handleChange}
                  className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  placeholder="e.g. 15"
                />
              </label>
            ) : null}
            <label className="flex items-center gap-3 rounded-xl border border-white/60 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm">
              <input
                type="checkbox"
                name="registration_paid"
                checked={form.registration_paid}
                onChange={handleChange}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              Registration fee received
            </label>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Summary: {feeSummary}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">
              Initial Payment (optional)
            </p>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <input
                type="checkbox"
                checked={form.initialPayment.enabled}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    initialPayment: {
                      ...prev.initialPayment,
                      enabled: event.target.checked,
                    },
                  }))
                }
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              Enable
            </label>
          </div>
          {form.initialPayment.enabled ? (
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="flex flex-col text-sm font-medium text-slate-700">
                Plan
                <select
                  name="plan_id"
                  value={form.initialPayment.plan_id}
                  onChange={(event) => {
                    const nextPlanId = event.target.value;
                    setForm((prev) => {
                      const selectedPlan = plans.find(
                        (plan) => plan.id === nextPlanId
                      );
                      const nextValidUntil =
                        selectedPlan && prev.initialPayment.valid_from
                          ? new Date(
                              Date.parse(prev.initialPayment.valid_from) +
                                selectedPlan.duration_days * 86400000
                            )
                              .toISOString()
                              .slice(0, 10)
                          : prev.initialPayment.valid_until;
                      return {
                        ...prev,
                        initialPayment: {
                          ...prev.initialPayment,
                          plan_id: nextPlanId,
                          amount_paid:
                            selectedPlan?.price ?? prev.initialPayment.amount_paid,
                          valid_until: nextValidUntil,
                        },
                      };
                    });
                  }}
                  className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="">Select plan</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} — ₹{plan.price?.toLocaleString("en-IN")}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col text-sm font-medium text-slate-700">
                Amount (₹)
                <input
                  name="amount_paid"
                  type="number"
                  value={form.initialPayment.amount_paid}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      initialPayment: {
                        ...prev.initialPayment,
                        amount_paid: event.target.value,
                      },
                    }))
                  }
                  className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  min="0"
                />
              </label>
              <label className="flex flex-col text-sm font-medium text-slate-700">
                Paid Via
                <select
                  name="payment_mode"
                  value={form.initialPayment.payment_mode}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      initialPayment: {
                        ...prev.initialPayment,
                        payment_mode: event.target.value,
                      },
                    }))
                  }
                  className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="upi">UPI / Online</option>
                  <option value="cash">Cash</option>
                </select>
              </label>
              <label className="flex flex-col text-sm font-medium text-slate-700">
                Valid From
                <input
                  type="date"
                  value={form.initialPayment.valid_from}
                  onChange={(event) =>
                    setForm((prev) => {
                      const selectedPlan = plans.find(
                        (plan) => plan.id === prev.initialPayment.plan_id
                      );
                      let nextValidUntil = prev.initialPayment.valid_until;
                      if (selectedPlan) {
                        nextValidUntil = new Date(
                          Date.parse(event.target.value) +
                            selectedPlan.duration_days * 86400000
                        )
                          .toISOString()
                          .slice(0, 10);
                      }
                      return {
                        ...prev,
                        initialPayment: {
                          ...prev.initialPayment,
                          valid_from: event.target.value,
                          valid_until: nextValidUntil,
                        },
                      };
                    })
                  }
                  className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </label>
              <label className="flex flex-col text-sm font-medium text-slate-700">
                Valid Until
                <input
                  type="date"
                  value={form.initialPayment.valid_until}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      initialPayment: {
                        ...prev.initialPayment,
                        valid_until: event.target.value,
                      },
                    }))
                  }
                  className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </label>
              <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 md:col-span-2">
                <input
                  type="checkbox"
                  checked={form.initialPayment.includes_registration}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      initialPayment: {
                        ...prev.initialPayment,
                        includes_registration: event.target.checked,
                      },
                    }))
                  }
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                Include registration fees
              </label>
              <label className="flex flex-col text-sm font-medium text-slate-700 md:col-span-2">
                Notes (optional)
                <textarea
                  value={form.initialPayment.notes}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      initialPayment: {
                        ...prev.initialPayment,
                        notes: event.target.value,
                      },
                    }))
                  }
                  rows={2}
                  className="mt-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  placeholder="Payment comments"
                />
              </label>
            </div>
          ) : null}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col text-sm font-medium text-slate-700">
            Join Date
            <input
              name="join_date"
              type="date"
              value={form.join_date}
              onChange={handleChange}
              className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </label>

          {isEdit && (
            <>
              <label className="flex flex-col text-sm font-medium text-slate-700">
                Current Plan
                <select
                  name="current_plan_id"
                  value={form.current_plan_id || ""}
                  onChange={handleChange}
                  className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="">Not Assigned</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col text-sm font-medium text-slate-700">
                Renewal Date
                <input
                  name="renewal_date"
                  type="date"
                  value={form.renewal_date || ""}
                  onChange={handleChange}
                  className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </label>

              <label className="flex flex-col text-sm font-medium text-slate-700">
                Status
                <div className="mt-2 flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={form.is_active}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>{form.is_active ? "Active" : "Inactive"}</span>
                </div>
              </label>

              <div className="flex flex-col text-sm font-medium text-slate-700">
                Assigned Seat
                <div className="mt-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  {assignedSeat ? assignedSeat.seat_number : "No seat assigned"}
                </div>
              </div>
            </>
          )}
        </div>

        {isEdit ? (
          <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LucideIcon name="history" className="h-4 w-4 text-indigo-500" />
                <p className="text-sm font-semibold text-slate-800">Recent activity</p>
              </div>
              {historyLoading ? (
                <span className="text-xs text-slate-500">Loading…</span>
              ) : null}
            </div>
            <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
              {historyLoading ? null : history.length === 0 ? (
                <p className="text-xs text-slate-500">No activity logged yet.</p>
              ) : (
                history.map((entry) => {
                  const when = entry.created_at
                    ? new Date(entry.created_at).toLocaleString()
                    : "";
                  const meta = entry.metadata || {};
                  const metaPreview =
                    Object.entries(meta)
                      .slice(0, 2)
                      .map(([key, value]) => `${key}: ${String(value)}`)
                      .join(" • ") || null;
                  return (
                    <div
                      key={entry.id}
                      className="rounded-xl border border-slate-100 bg-white px-3 py-2 text-xs text-slate-700"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold capitalize">{entry.action}</span>
                        <span className="text-[11px] text-slate-500">{when}</span>
                      </div>
                      {entry.actor_role || entry.actor_id ? (
                        <p className="text-[11px] text-slate-500">
                          {entry.actor_role ? `${entry.actor_role}` : "User"} {entry.actor_id ?? ""}
                        </p>
                      ) : null}
                      {metaPreview ? (
                        <p className="text-[11px] text-slate-500">{metaPreview}</p>
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : null}

        <div className="flex justify-between gap-3">
          <div className="inline-flex items-center gap-2 text-xs text-slate-500">
            <LucideIcon name="shield" className="h-4 w-4 text-indigo-500" />
            Aadhaar and KYC are stored securely for desk verification.
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
            >
              {isEdit ? "Save Changes" : "Create Student"}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default StudentModal;
   
