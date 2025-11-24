import { listPlans } from "../services/plans.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getPlans = asyncHandler(async (req, res) => {
  const plans = await listPlans();
  res.json({ data: plans });
});

