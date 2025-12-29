cp app/api/me/route.ts app/api/me/route.ts.bak

cat > app/api/me/route.ts <<'EOF'
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/app/_utils/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createSupabaseServerClient();

    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
    }

    return NextResponse.json({ ok: true, id: user.id }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String((e as any)?.message ?? e) }, { status: 500 });
  }
}
EOF
