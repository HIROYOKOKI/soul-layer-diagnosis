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

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = getSupabase()
  if (!supabase) {
    return NextResponse.json({ error: 'Server env not set' }, { status: 500 })
  }

  const { data, error } = await supabase
    .from('profile_results')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error) {
    console.error('[Supabase] fetch error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
