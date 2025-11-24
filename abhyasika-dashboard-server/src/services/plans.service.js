import { supabase } from "../config/supabaseClient.js";
import { ensureSupabaseResult } from "../utils/supabase.js";

export async function listPlans() {
  const result = await supabase
    .from("plans")
    .select("*")
    .order("price", { ascending: true });

  return ensureSupabaseResult(result, "Failed to fetch plans");
}

