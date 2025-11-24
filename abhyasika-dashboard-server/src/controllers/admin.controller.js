import {
  createTeamMemberAccount,
  inviteTeamMember,
} from "../services/admin.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const postManualTeamMember = asyncHandler(async (req, res) => {
  const { email, password, fullName, role_id } = req.body;

  const user = await createTeamMemberAccount({
    email,
    password,
    fullName,
    roleId: role_id,
    adminId: req.user.id,
  });

  res.status(201).json({ data: user });
});

export const postInviteTeamMember = asyncHandler(async (req, res) => {
  const { email, fullName, role_id } = req.body;

  const user = await inviteTeamMember({
    email,
    fullName,
    roleId: role_id,
    adminId: req.user.id,
  });

  res.status(201).json({ data: user });
});
