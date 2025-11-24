import { Router } from "express";
import {
  postInviteTeamMember,
  postManualTeamMember,
} from "../controllers/admin.controller.js";

const router = Router();

router.post("/team-members/manual", postManualTeamMember);
router.post("/team-members/invite", postInviteTeamMember);

export default router;
