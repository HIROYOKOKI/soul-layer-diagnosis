import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 将来: ここで scope ごとの集計/履歴を論理削除 or アーカイブ
export async function POST(req: Request) {
  try {
    // const { scope } = await req.json().catch(() => ({}));
    // TODO: Supabase 等でテーマ依存レコードをソフトリセット
    return NextResponse.json({ ok: true, resetApplied: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? 'reset_failed' }, { status: 500 });
  }
}
