import { Router } from "express";
import plansRoutes from "./plans.routes.js";
import studentsRoutes from "./students.routes.js";
import seatsRoutes from "./seats.routes.js";
import paymentsRoutes from "./payments.routes.js";
import settingsRoutes from "./settings.routes.js";
import expensesRoutes from "./expenses.routes.js";
import { requireAuth } from "../middleware/auth.js";
import adminRoutes from "./admin.routes.js";

const router = Router();

router.use(requireAuth);
router.use("/plans", plansRoutes);
router.use("/students", studentsRoutes);
router.use("/seats", seatsRoutes);
router.use("/payments", paymentsRoutes);
router.use("/settings", settingsRoutes);
router.use("/expenses", expensesRoutes);
router.use("/admin", adminRoutes);

export default router;
