import { listPayments, createPayment } from "../services/payments.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getPayments = asyncHandler(async (req, res) => {
  const { limit, startDate, endDate } = req.query;
  const parsedLimit = limit ? Math.min(parseInt(limit, 10) || 100, 500) : 100;
  const payments = await listPayments({
    limit: parsedLimit,
    startDate,
    endDate,
  });
  res.json({ data: payments });
});

export const postPayment = asyncHandler(async (req, res) => {
  const result = await createPayment(req.body);
  res.status(201).json({ data: result });
});

