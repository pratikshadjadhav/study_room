import {
  listSeats,
  assignSeat,
  deallocateSeat,
  createSeat,
} from "../services/seats.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getSeats = asyncHandler(async (req, res) => {
  const seats = await listSeats();
  res.json({ data: seats });
});

export const postCreateSeat = asyncHandler(async (req, res) => {
  const seat = await createSeat(req.body);
  res.status(201).json({ data: seat });
});

export const postAssignSeat = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { studentId } = req.body;
  const result = await assignSeat(id, studentId);
  res.json({ data: result });
});

export const postDeallocateSeat = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await deallocateSeat(id);
  res.json({ data: result });
});
