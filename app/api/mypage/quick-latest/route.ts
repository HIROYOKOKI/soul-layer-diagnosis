import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ ok:false, error:'supabase_env_missing' }, { status:500 });

  // スキーマ: type_key(text), type_label(text), order_v2(jsonb), created_at(timestamp)
  const { data, error } = await sb
    .from('quick_results')
    .select('type_key, type_label, order_v2, created_at')
    .order('created_at', { ascending:false })
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ ok:false, error:error.message }, { status:500 });

  // 返却形を /mypage 用に正規化
  return NextResponse.json({
    ok: true,
    item: data ? {
      model: (data.type_key ?? null) as 'EVΛƎ' | 'EΛVƎ' | null,
      label: (data.type_label ?? null) as string | null,
      order: (data.order_v2 ?? null) as string[] | null,
      created_at: data.created_at ?? null,
    } : null,
  });
}
