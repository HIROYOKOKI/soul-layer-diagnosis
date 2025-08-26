// app/api/structure/quick/diagnose/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

type Choice = 'A'|'B'|'C'|'D'
type QuickResultType = 'EVΛƎ型' | 'EΛVƎ型' | 'ΛƎEΛ型' | '中立'

function getSupabase() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

function mapChoice(choice: Choice): { type: QuickResultType; comment: string; advice: string; weight: number } {
  switch (choice) {
    case 'A':
      return {
        type: 'EVΛƎ型',
        comment: 'まず動いて景色を変える起動型。勢いと即応で道を拓くが、振り返りの間を忘れがち。',
        advice: '5分だけログを書く。動きの痕跡が次の加速になる。',
        weight: 0.8
      }
    case 'B':
      return {
        type: 'EΛVƎ型',
        comment: '目的と制約を先に確定し要点を選ぶ戦略型。決断が速い反面、余白を削り過ぎに注意。',
        advice: '“遊び時間”を15分入れる。発見は余白に宿る。',
        weight: 0.8
      }
    case 'C':
      return {
        type: 'ΛƎEΛ型',
        comment: '観測→小さく選択→点火→再選択の検証主義。精度は高いが初速は控えめ。',
        advice: 'ミニ実験を1つ増やす。失敗基準も先に決める。',
        weight: 0.8
      }
    case 'D':
    default:
      return {
        type: '中立',
        comment: '状況に応じて回路を切替える柔軟型。芯の起動順が曖昧だと迷いやすい。',
        advice: '今日は最初の一歩をE/V/Λ/Ǝのどれにするか宣言して始める。',
        weight: 0.3
      }
  }
}

export async function POST(req: Request) {
  try {
    const supabase = getSupabase()
    if (!supabase) return NextResponse.json({ error: 'Server env not set' }, { status: 500 })

    const body = await req.json() as { choice?: Choice; user_id?: string | null }
    const choice = body.choice
    if (!choice || !['A','B','C','D'].includes(choice)) {
      return NextResponse.json({ error: 'Invalid choice' }, { status: 400 })
    }

    const mapped = mapChoice(choice as Choice)

    // 保存：structure_results（なければ作成してね）
    const { data, error } = await supabase
      .from('structure_results')
      .insert([{
        kind: 'quick',              // 種別
        choice,                     // A/B/C/D
        type: mapped.type,          // EVΛƎ型など
        weight: mapped.weight,      // 0.8 or 0.3
        user_id: body.user_id ?? null
      }])
      .select('id,type,weight')
      .single()

    if (error) {
      console.error('[Supabase] quick insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      id: data.id,
      type: mapped.type,
      weight: mapped.weight,
      comment: mapped.comment,
      advice: mapped.advice
    })
  } catch (e) {
    console.error('quick diagnose error:', e)
    return NextResponse.json({ error: 'Failed to diagnose' }, { status: 500 })
  }
}
