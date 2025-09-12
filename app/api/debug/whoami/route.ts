// app/api/debug/whoami/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  const helper = createRouteHandlerClient({ cookies });
  let { data: { user }, error } = await helper.auth.getUser();

  const auth = req.headers.get("authorization");
  const bearer = auth?.startsWith("Bearer ") ? auth.slice(7) : undefined;
  let bearerUser: any = null;
  if (bearer) {
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const r = await sb.auth.getUser(bearer);
    bearerUser = r.data.user ?? null;
  }

  return NextResponse.json({
    cookieNames: cookies().getAll().map(c => c.name),
    cookieUserId: user?.id ?? null,
    bearerPresent: !!bearer,
    bearerUserId: bearerUser?.id ?? null,
    helperError: error?.message ?? null,
    env: {
      url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      anon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      // SERVICE_ROLE_KEY はここでは不要。falseでもOK
      srk: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
  });
}
