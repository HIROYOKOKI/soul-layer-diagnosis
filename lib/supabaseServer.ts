import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import type { SupabaseClient } from "@supabase/supabase-js";
export function getSupabaseServer(): SupabaseClient {
  return createRouteHandlerClient({ cookies });
}
