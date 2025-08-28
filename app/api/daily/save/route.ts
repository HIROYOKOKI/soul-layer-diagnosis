// app/api/daily/save/route.ts
import { NextRequest, NextResponse } from 'next/server'

// ── ランタイム設定 ───────────────────────────
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ── 型（no-explicit-any を避ける） ─────────────
type Code = 'E' | 'V' | 'Λ' | 'Ǝ'
type Mode = 'friend' | 'lover' | 'boss' | 'self'

type SaveBody = {
  code: Code
  navigator: 'lunea'
  mode?: Mode
  meta?: { label?: string | null; hint?: string | null }
}

function isCode(v: unknown): v is Code {
  return v === 'E' || v === 'V' || v === 'Λ' || v === 'Ǝ'
}
function isMode(v: unknown): v is Mode {
  return v === 'friend' || v === 'lover' || v === 'boss' || v === 'self'
}

// Supabase 戻り値（使う最小限のフィールドだけ）
type InsertedRecord = {
  id: number
  code: string
  navigator: string
  mode: string
  choice?: string | null
  created_at: string
}

// ── ハンドラ ────────────────────────────────
export async function POST(req: NextRequest) {
  // 1) 入力パース
  let payloadUnknown: unknown
  try {
    payloadUnknown = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const p = payloadUnknown as Partial<SaveBody>

  // 2) バリデーション
  if (!isCode(p.code)) return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
  if (p.navigator !== 'lunea') return NextResponse.json({ error: 'Invalid navigator' }, { status: 400 })
  const mode: Mode = isMode(p.mode) ? p.mode : 'friend'
  const choiceLabel = p.meta?.label ?? null

  // 3) 保存レコード（あなたのテーブル構成に合わせてマップ）
  const record = {
    code: p.code,
    navigator: 'lunea',
    mode,
    choice: choiceLabel,
    created_at: new Date().toISOString(),
  }

  // 4) 環境変数（未設定でもビルドを落とさない）
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const SUPABASE_ANON_KEY =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return NextResponse.json(
      { stored: false, reason: 'no_supabase_env', record },
      { status: 200, headers: { 'x-storage': 'fallback' } },
    )
  }

  // 5) Supabase へ保存（RLS 有効時は insert ポリシーが必要）
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  const { data, error } = await supabase
    .from('daily_results')
    .insert([record])
    .select()
    .single()

  if (error) {
    const detail = error instanceof Error ? error.message : safeStringify(error)
    return NextResponse.json(
      { stored: false, error: 'supabase_insert_failed', detail },
      { status: 500 },
    )
  }

  const rec = (data ?? null) as InsertedRecord | null

  return NextResponse.json(
    { stored: true, id: rec?.id ?? null, record },
    { status: 200, headers: { 'x-storage': 'supabase' } },
  )
}

// ── util ───────────────────────────────────
function safeStringify(e: unknown): string {
  try { return JSON.stringify(e) } catch { return String(e) }
}
