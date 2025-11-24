import { Router } from "express";
import {
  getStudents,
  postStudent,
  putStudent,
  patchStudentToggleActive,
} from "../controllers/students.controller.js";

const router = Router();

router.get("/", getStudents);
router.post("/", postStudent);
router.put("/:id", putStudent);
router.patch("/:id/toggle-active", patchStudentToggleActive);

export default router;

