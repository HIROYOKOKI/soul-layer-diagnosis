// app/api/structure/quick/result/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

type Row = {
  id: string
  type: 'EVΛƎ型' | 'EΛVƎ型' | 'ΛƎEΛ型' | '中立'
  weight: number
  comment: string
  advice: string
  created_at: string
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    return NextResponse.json({ error: 'supabase env not set' }, { status: 500 })
  }

  const supabase = createClient(url, key)
  const { data, error } = await supabase
    .from('structure_results')
    .select('id,type,weight,comment,advice,created_at')
    .eq('id', id)
    .limit(1)
    .maybeSingle<Row>()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const res = {
    id: data.id,
    type: data.type,
    weight: data.weight,
    comment: data.comment,
    advice: data.advice,
  }
  return NextResponse.json(res, { status: 200 })
}
