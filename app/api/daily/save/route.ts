import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
export const runtime = 'nodejs'

type Score = { E:number; V:number; Λ:number; Ǝ:number }
 HEAD
type Body = {
  userId?: string; theme?: 'work'|'love'|'future'|'self'; choice?: 'E'|'V'|'Λ'|'Ǝ';
  structure_score?: Partial<Score>; comment?: string; advice?: string
}

function getSb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

export async function POST(req: Request) {
  const sb = getSb()
  if (!sb) return NextResponse.json({ error:'supabase_not_configured' }, { status:503 })
  const b = (await req.json()) as Body
  if (!b.theme) return NextResponse.json({ error:'bad_request', detail:'theme required' }, { status:400 })

type Body = { userId?:string; theme?:'work'|'love'|'future'|'self'; choice?:'E'|'V'|'Λ'|'Ǝ'; structure_score?:Partial<Score>; comment?:string; advice?:string }

function getSb(){
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if(!url || !key) return null
  return createClient(url, key, { auth:{ persistSession:false } })
}

export async function POST(req: Request){
  const sb = getSb()
  if(!sb) return NextResponse.json({ error:'supabase_not_configured' }, { status:503 })
  const b = (await req.json()) as Body
  if(!b.theme) return NextResponse.json({ error:'bad_request', detail:'theme required' }, { status:400 })
 81de7de (assets: add login-intro.mp4 / login-still.png)

  const payload = {
    user_id: b.userId ?? 'guest',
    theme: b.theme,
    choice: b.choice ?? null,
    structure_score: {
      E: Number(b.structure_score?.E ?? 0),
      V: Number(b.structure_score?.V ?? 0),
      Λ: Number(b.structure_score?.Λ ?? 0),
      Ǝ: Number(b.structure_score?.Ǝ ?? 0),
    },
    comment: b.comment ?? null,
    advice: b.advice ?? null,
  }
HEAD
  const { data, error } = await sb.from('daily_results')
    .insert([payload]).select('id,created_at').single()
  if (error) return NextResponse.json({ error:'insert_failed', detail:error.message }, { status:500 })
  return NextResponse.json({ ok:true, id:data?.id, created_at:data?.created_at })
}

export function GET(){ return NextResponse.json({ ok:true, endpoint:'/api/daily/save' }) }

  const { data, error } = await sb.from('daily_results').insert([payload]).select('id,created_at').single()
  if(error) return NextResponse.json({ error:'insert_failed', detail:error.message }, { status:500 })
  return NextResponse.json({ ok:true, id:data?.id, created_at:data?.created_at })
}

export function GET(){
  return NextResponse.json({ ok:true, endpoint:'/api/daily/save' })
}
81de7de (assets: add login-intro.mp4 / login-still.png)
