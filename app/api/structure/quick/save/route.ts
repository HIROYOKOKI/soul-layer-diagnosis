// app/api/structure/quick/save/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

// 実際にフロントから送っている“型名”に合わせる
// 例: QuickClient.tsx の makeResultFrom が返す値
type QuickResultType = 'EVΛƎ型' | 'EΛVƎ型' | 'ΛEƎV型' | 'ƎVΛE型' | '中立'

type SavePayload = {
  type: QuickResultType
  weight: number
  comment: string
  // advice は保存しない想定（将来追加するならテーブル ALTER が必要）
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error(
      'Missing Supabase env. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
    )
  }
  // Service Role Key: サーバ限定で使用（RLSに依存せず INSERT 可）
  return createClient(url, serviceKey, { auth: { persistSession: false } })
}

function isValidType(t: unknown): t is QuickResultType {
  return (
    t === 'EVΛƎ型' ||
    t === 'EΛVƎ型' ||
    t === 'ΛEƎV型' ||
    t === 'ƎVΛE型' ||
    t === '中立'
  )
}

function isFiniteNumber(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n)
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()

    const body = (await req.json()) as Partial<SavePayload> | null
    if (!body) {
      return NextResponse.json({ error: 'Empty payload' }, { status: 400 })
    }

    const { type, weight, comment } = body

    // ✅ バリデーション（型名 / 重み / コメント）
    if (!isValidType(type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }
    if (!isFiniteNumber(weight) || weight < 0 || weight > 1) {
      return NextResponse.json({ error: 'Invalid weight (0..1)' }, { status: 400 })
    }
    if (typeof comment !== 'string' || comment.trim().length === 0) {
      return NextResponse.json({ error: 'Invalid comment' }, { status: 400 })
    }

    // INSERT（id は DB 側で uuid など自動採番想定）
    const { data, error } = await supabase
      .from('structure_results')
      .insert([{ type, weight, comment }])
      .select('id')
      .single()

    if (error) {
      console.error('[quick/save] supabase insert failed:', error)
      return NextResponse.json(
        { error: 'db error', details: error.message },
        { status: 500 }
      )
    }

    // フロントは id が取れれば十分（Confirm → Result 遷移）
    return NextResponse.json({ id: data?.id }, { status: 201 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown error'
    console.error('[quick/save] exception:', e)
    return NextResponse.json({ error: 'server error', details: msg }, { status: 500 })
  }
}
