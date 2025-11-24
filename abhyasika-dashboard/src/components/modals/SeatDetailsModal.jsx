import React from "react";
import Modal from "../common/Modal.jsx";

function SeatDetailsModal({ open, onClose, seat, student, onDeallocate }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={seat ? `Seat ${seat.seat_number}` : "Seat Details"}
    >
      <div className="space-y-5 text-sm text-slate-700">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Seat Number
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {seat?.seat_number ?? "—"}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Status
            </p>
            <p className="mt-1 text-lg font-semibold capitalize text-slate-900">
              {seat?.status ?? "—"}
            </p>
          </div>
        </div>

        {seat?.status === "occupied" && student ? (
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">
              Occupied By
            </p>
            <p className="mt-2 text-lg font-semibold text-indigo-900">
              {student.name}
            </p>
            <p className="text-sm text-indigo-700">Phone: {student.phone || "—"}</p>
            <p className="text-sm text-indigo-700">
              Renewal Date:{" "}
              {student.renewal_date
                ? new Date(student.renewal_date).toLocaleDateString()
                : "—"}
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
            This seat is currently not allocated.
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Close
          </button>
          {seat?.status === "occupied" ? (
            <button
              type="button"
              onClick={onDeallocate}
              className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-400"
            >
              Deallocate Seat
            </button>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}

export default SeatDetailsModal;

