// app/api/structure/quick/save/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

type QuickResultType = 'EVΛƎ型' | 'EΛVƎ型' | 'ΛƎEΛ型' | '中立'

type SavePayload = {
  type: QuickResultType
  weight: number
  comment: string
  // advice はテーブルに無い想定なので受け取っても保存しません
  // user_id などを将来使う場合はここに追加
}

type RowSelect = {
  id: string
  type: QuickResultType
  weight: number
  comment: string
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  // AnonでINSERT/SELECTできるRLSポリシー前提
  return createClient(url, key, { auth: { persistSession: false } })
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Server env not set (NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY)' },
        { status: 500 }
      )
    }

    const body = (await req.json()) as SavePayload | null
    if (!body) {
      return NextResponse.json({ error: 'Empty payload' }, { status: 400 })
    }

    const { type, weight, comment } = body
    const validType = type === 'EVΛƎ型' || type === 'EΛVƎ型' || type === 'ΛƎEΛ型' || type === '中立'
    const validWeight = typeof weight === 'number' && Number.isFinite(weight)
    const validComment = typeof comment === 'string' && comment.length > 0

    if (!validType || !validWeight || !validComment) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    // INSERT（advice は未保存想定）
    const { data, error } = await supabase
      .from('structure_results')
      .insert({ type, weight, comment })
      .select('id,type,weight,comment')
      .single<RowSelect>()

    if (error) {
      return NextResponse.json(
        { error: `supabase insert failed: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { id: data.id, type: data.type, weight: data.weight, comment: data.comment },
      { status: 200 }
    )
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown error'
    return NextResponse.json({ error: `unexpected: ${msg}` }, { status: 500 })
  }
}
