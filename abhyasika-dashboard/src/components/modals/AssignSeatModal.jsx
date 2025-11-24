import React, { useState } from "react";
import Modal from "../common/Modal.jsx";

function AssignSeatModal({ open, onClose, seat, students, onSubmit }) {
  const [selectedId, setSelectedId] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!selectedId) {
      alert("Please select a student.");
      return;
    }
    onSubmit(selectedId);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={seat ? `Assign Seat ${seat.seat_number}` : "Assign Seat"}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Assigning{" "}
          <span className="font-semibold text-slate-900">
            {seat?.seat_number ?? "seat"}
          </span>{" "}
          to an active student without a seat.
        </div>

        <label className="flex flex-col text-sm font-medium text-slate-700">
          Select Student
          <select
            value={selectedId}
            onChange={(event) => setSelectedId(event.target.value)}
            className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="">Choose student</option>
            {students.length === 0 ? (
              <option value="" disabled>
                No available students
              </option>
            ) : (
              students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name}
                </option>
              ))
            )}
          </select>
        </label>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:bg-slate-400"
            disabled={students.length === 0}
          >
            Assign Seat
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default AssignSeatModal;

