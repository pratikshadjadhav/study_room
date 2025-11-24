import { AppError } from "../utils/AppError.js";
import { supabase } from "../config/supabaseClient.js";

export async function requireAuth(req, res, next) {
  if (req.method === "OPTIONS") {
    return next();
  }

  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : null;

  if (!token) {
    throw new AppError("Unauthorized", 401);
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    throw new AppError("Unauthorized", 401);
  }

  req.user = data.user;
  next();
}
