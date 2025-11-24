import { asyncHandler } from "../utils/asyncHandler.js";
import { listExpenses, createExpense } from "../services/expenses.service.js";

export const getExpenses = asyncHandler(async (req, res) => {
  const data = await listExpenses(req.user.id);
  res.json({ data });
});

export const postExpense = asyncHandler(async (req, res) => {
  const payload = req.body;
  if (!payload?.title || !payload?.amount) {
    return res.status(400).json({
      error: {
        message: "Title and amount are required",
        status: 400,
      },
    });
  }
  const expense = await createExpense(req.user.id, payload);
  res.status(201).json({ data: expense });
});

