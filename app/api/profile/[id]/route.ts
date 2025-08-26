// app/api/profile/[id]/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

function getSupabase() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

// context.params が {id:string} または Promise<{id:string}> の双方に対応
type Ctx =
  | { params: { id: string } }
  | { params: Promise<{ id: string }> }

export async function GET(_req: Request, context: Ctx) {
  const supabase = getSupabase()
  if (!supabase) {
    return NextResponse.json({ error: 'Server env not set' }, { status: 500 })
  }

  // params を実体化
  const raw = (context as any).params
  const resolved = raw && typeof raw.then === 'function' ? await raw : raw
  const id = (resolved?.id ?? '') as string
  if (!id) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('profile_results')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('[Supabase] fetch error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
