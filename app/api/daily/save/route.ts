// app/api/daily/save/route.ts
import { NextRequest, NextResponse } from 'next/server'

// ─────────────────────────────
// 型
// ─────────────────────────────
type Code = 'E' | 'V' | 'Λ' | 'Ǝ'
type LuneaMode = 'friend' | 'lover' | 'boss' | 'self'

type SaveBody = {
  code: Code
  navigator: 'lunea'            // 将来拡張可
  mode?: LuneaMode              // デフォルトは 'friend'
  meta?: {
    questionId?: string
  }
}

function isCode(v: unknown): v is Code {
  return v === 'E' || v === 'V' || v === 'Λ' || v === 'Ǝ'
}
function isMode(v: unknown): v is LuneaMode {
  return v === 'friend' || v === 'lover' || v === 'boss' || v === 'self'
}

// ─────────────────────────────
// ランタイム設定（NodeでOK）
// ─────────────────────────────
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ─────────────────────────────
// POST /api/daily/save
// ─────────────────────────────
export async function POST(req: NextRequest) {
  // 1) 入力を安全にパース
  let payloadUnknown: unknown
  try {
    payloadUnknown = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // 2) バリデーション（no-explicit-any 回避）
  const p = payloadUnknown as Partial<SaveBody>
  if (!isCode(p.code)) {
    return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
  }
  if (p.navigator !== 'lunea') {
    return NextResponse.json({ error: 'Invalid navigator' }, { status: 400 })
  }
  const mode: LuneaMode = isMode(p.mode) ? p.mode : 'friend'

  // 3) 保存用レコード
  const record = {
    code: p.code,
    navigator: p.navigator,
    mode,
    meta: p.meta ?? null,
    created_at: new Date().toISOString(),
    // 参考情報（あれば）
    ip: req.headers.get('x-forwarded-for') ?? null,
    ua: req.headers.get('user-agent') ?? null,
  }

  // 4) Supabase へ保存（環境変数が無い場合はフォールバックで成功レス）
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const SUPABASE_ANON_KEY =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    // フォールバック：ビルド/実行を絶対に落とさない
    return NextResponse.json(
      { stored: false, reason: 'no_supabase_env', record },
      { status: 200, headers: { 'x-storage': 'fallback' } },
    )
  }

  // 動的インポート（ビルド時評価を避ける）
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  // 5) テーブル名：daily_results（必要に応じて変更OK）
  const { data, error } = await supabase.from('daily_results').insert([record]).select().single()

  if (error) {
    return NextResponse.json({ error: 'Supabase insert failed', detail: stringifyError(error) }, { status: 500 })
  }

  return NextResponse.json(
    { stored: true, id: data?.id ?? null, record },
    { status: 200, headers: { 'x-storage': 'supabase' } },
  )
}

// エラー表示（型安全）
function stringifyError(e: unknown): string {
  if (e instanceof Error) return e.message
  try { return JSON.stringify(e) } catch { return String(e) }
}
