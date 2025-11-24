import { createClient } from "@supabase/supabase-js";
import { config } from "./env.js";

export const supabase = createClient(
  config.supabaseUrl,
  config.supabaseServiceRoleKey,
  {
    auth: {
      persistSession: false,
    },
    global: {
      headers: {
        "x-application-name": "abhyasika-dashboard-server",
      },
    },
  }
);

