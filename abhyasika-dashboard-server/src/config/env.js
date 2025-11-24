import dotenv from "dotenv";

dotenv.config();

const requiredEnvVars = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];

requiredEnvVars.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

export const config = {
  port: parseInt(process.env.PORT ?? "4000", 10),
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  logLevel: process.env.LOG_LEVEL ?? "info",
  appUrl: process.env.APP_PUBLIC_URL ?? "http://localhost:5173",
};
