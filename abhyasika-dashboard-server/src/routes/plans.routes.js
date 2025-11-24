import { Router } from "express";
import { getPlans } from "../controllers/plans.controller.js";

const router = Router();

router.get("/", getPlans);

export default router;

