import { Router } from "express";
import { getPayments, postPayment } from "../controllers/payments.controller.js";

const router = Router();

router.get("/", getPayments);
router.post("/", postPayment);

export default router;

