// app/api/structure/quick/diagnose/route.ts
import { NextResponse, NextRequest } from 'next/server'

export const runtime = 'nodejs'

type Choice = 'A' | 'B' | 'C' | 'D'
type QuickResultType = 'EVΛƎ型' | 'EΛVƎ型' | 'ΛƎEΛ型' | '中立'

type Result = {
  type: QuickResultType
  weight: number
  comment: string
  advice: string
}

// A/B/C/D → タイプ・コメントなどを返す
function mapChoice(choice: Choice): Result {
  switch (choice) {
    case 'A':
      return {
        type: 'EVΛƎ型',
        weight: 0.8,
        comment: '衝動と行動で流れを作る傾向。まず動いて学びを回収するタイプ。',
        advice: '小さく始めて10分だけ着手。後で整える前提で前へ。'
      }
    case 'B':
      return {
        type: 'ΛƎEΛ型',
        weight: 0.8,
        comment: '制約と目的から最短を選ぶ傾向。判断の速さが強み。',
        advice: '目的→制約→手順の3点をメモに落としてからGO。'
      }
    case 'C':
      return {
        type: 'EΛVƎ型',
        weight: 0.8,
        comment: '観測→小実験→選び直しの循環。状況把握が得意。',
        advice: 'まず1回だけ試す。結果を観て次の一手を更新。'
      }
    case 'D':
    default:
      return {
        type: '中立',
        weight: 0.3,
        comment: '状況適応型。どの構造にも寄り過ぎない柔軟さ。',
        advice: '今は「やらない」も選択。時間を区切って再判断。'
      }
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { choice?: Choice }
    const choice = body?.choice
    if (!choice || !['A', 'B', 'C', 'D'].includes(choice)) {
      return NextResponse.json({ error: 'Invalid choice' }, { status: 400 })
    }

    const mapped = mapChoice(choice as Choice)

    // 保存せず、診断結果だけ返す
    return NextResponse.json(
      {
        type: mapped.type,
        weight: mapped.weight,
        comment: mapped.comment,
        advice: mapped.advice,
      },
      { status: 200 }
    )
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown error'
    return NextResponse.json({ error: `unexpected: ${msg}` }, { status: 500 })
  }
}
