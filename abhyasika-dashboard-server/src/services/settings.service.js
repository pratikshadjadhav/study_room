import { supabase } from "../config/supabaseClient.js";
import { AppError } from "../utils/AppError.js";

const TABLE = "admin_settings";

export async function getAdminSettings(adminId) {
  const result = await supabase
    .from(TABLE)
    .select("preferences")
    .eq("admin_id", adminId)
    .maybeSingle();

  if (result.error && result.error.code !== "PGRST116") {
    throw new AppError(result.error.message, 500);
  }

  return result.data?.preferences ?? null;
}

export async function upsertAdminSettings(adminId, preferences) {
  const payload = {
    admin_id: adminId,
    preferences,
  };

  const result = await supabase
    .from(TABLE)
    .upsert(payload, { onConflict: "admin_id" })
    .select("preferences")
    .single();

  if (result.error) {
    throw new AppError(result.error.message, 500);
  }

  return result.data.preferences;
}

