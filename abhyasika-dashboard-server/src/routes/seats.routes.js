import { Router } from "express";
import {
  getSeats,
  postAssignSeat,
  postDeallocateSeat,
  postCreateSeat,
} from "../controllers/seats.controller.js";

const router = Router();

router.get("/", getSeats);
router.post("/", postCreateSeat);
router.post("/:id/assign", postAssignSeat);
router.post("/:id/deallocate", postDeallocateSeat);

export default router;
