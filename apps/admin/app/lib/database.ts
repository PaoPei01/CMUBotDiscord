import { createSupabaseAdminDatabase } from "@campus-qa/database";

export function getAdminDatabase() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  }

  return createSupabaseAdminDatabase({
    serviceRoleKey,
    supabaseUrl
  });
}
