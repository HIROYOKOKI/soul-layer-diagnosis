// app/api/mypage/quick-latest/route.ts
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const sb = getSupabaseAdmin();
  if (!sb) {
    return NextResponse.json({ ok: false, error: 'supabase_env_missing' }, { status: 500 });
  }

  const { data, error } = await sb
    .from('quick_results')
    .select('type_key, type_label, order_v2, created_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    item: data
      ? {
          model: data.type_key,          // "EVΛƎ" / "EΛVƎ"
          label: data.type_label,        // "未来志向型" / "現実思考型"
          order: data.order_v2,          // ["E","V","Λ","Ǝ"]
          created_at: data.created_at,
        }
      : null,
  });
}
