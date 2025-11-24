import { asyncHandler } from "../utils/asyncHandler.js";
import {
  getAdminSettings,
  upsertAdminSettings,
} from "../services/settings.service.js";

export const getSettings = asyncHandler(async (req, res) => {
  const settings = await getAdminSettings(req.user.id);
  res.json({
    data: settings,
  });
});

export const updateSettings = asyncHandler(async (req, res) => {
  const preferences = req.body?.preferences;
  if (typeof preferences !== "object" || preferences === null) {
    return res.status(400).json({
      error: {
        message: "Invalid payload. Expected preferences object.",
        status: 400,
      },
    });
  }

  const updated = await upsertAdminSettings(req.user.id, preferences);
  res.json({ data: updated });
});

