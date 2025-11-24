import {
  listStudents,
  createStudent,
  updateStudent,
  toggleStudentActive,
} from "../services/students.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getStudents = asyncHandler(async (req, res) => {
  const { search, is_active } = req.query;
  const filters = {};
  if (typeof is_active !== "undefined") {
    filters.isActive = is_active === "true";
  }
  if (search) {
    filters.search = search;
  }
  const students = await listStudents(filters);
  res.json({ data: students });
});

export const postStudent = asyncHandler(async (req, res) => {
  const student = await createStudent(req.body);
  res.status(201).json({ data: student });
});

export const putStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const student = await updateStudent(id, req.body);
  res.json({ data: student });
});

export const patchStudentToggleActive = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const student = await toggleStudentActive(id);
  res.json({ data: student });
});

