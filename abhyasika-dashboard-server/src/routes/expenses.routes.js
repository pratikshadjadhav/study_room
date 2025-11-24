import { Router } from "express";
import { getExpenses, postExpense } from "../controllers/expenses.controller.js";

const router = Router();

router.get("/", getExpenses);
router.post("/", postExpense);

export default router;

