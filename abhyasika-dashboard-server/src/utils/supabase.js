export function ensureSupabaseResult(result, errorMessage = "Supabase error") {
  if (result.error) {
    const err = new Error(result.error.message || errorMessage);
    err.statusCode = 500;
    err.details = result.error;
    throw err;
  }
  return result.data;
}

