// app/api/profile/diagnose/route.ts
import { NextResponse } from "next/server"
import { getOpenAI } from "../../../../lib/openai"
import { buildProfilePrompt, type ProfilePending } from "../../../../lib/prompts/ProfilePrompt"

type Pending = ProfilePending

type DiagnoseDetail = {
  fortune: string
  personality: string
  work: string
  partner: string
}

type AiJson = {
  detail: DiagnoseDetail
  luneaLines: string[]
}

/** 許容バッファつきの長さ調整（±10〜20字許容） */
function softClampText(
  src: string,
  { min, max, tol = 20, fallback }: { min: number; max: number; tol?: number; fallback: string }
) {
  const text = (src || "").trim()
  if (!text) return fallback

  if (text.length > max + tol) return text.slice(0, max)

  if (text.length < min - tol) {
    const need = min - text.length
    const add = (fallback || "").slice(0, need + 10)
    const merged = (text + " " + add).replace(/\s+/g, " ").trim()
    return merged.length > max ? merged.slice(0, max) : merged
  }

  return text
}

const FALLBACKS = {
  fortune:
    "今は小さな熱源が灯っている時期。迷いがあっても、最初の一歩を踏み出せば流れは整う。焦らず、でも止まらず、今日の小さな行動を重ねていこう。",
  personality:
    "直感の火力が高く、方向が定まると一気に集中できるタイプ。芯を決めると継続力が生まれ、周囲を巻き込む推進力に変わる。",
  work:
    "小さく試す→すぐ学ぶの反復が吉。短いスプリントで検証を回すと成果が伸びる。",
  partner:
    "熱量を尊重しつつ、リズムを整えてくれる相手と好相性。歩幅を合わせてくれる関係が長続きする。",
}

/** 項目ごとの最小/最大文字数レンジを pending から決定 */
function getRanges(pending: Pending) {
  const hasAstro = Boolean(pending?.birthTime && pending?.birthPlace)
  return {
    fortune: { min: hasAstro ? 200 : 150, max: hasAstro ? 250 : 200 },
    personality: { min: hasAstro ? 200 : 150, max: hasAstro ? 250 : 200 },
    work: { min: hasAstro ? 100 : 80, max: hasAstro ? 120 : 100 },
    partner: { min: hasAstro ? 100 : 80, max: hasAstro ? 120 : 100 },
  }
}

function sanitizeDetail(
  d: Partial<DiagnoseDetail> | undefined,
  ranges: ReturnType<typeof getRanges>
): DiagnoseDetail {
  const fortune = softClampText(d?.fortune || "", { ...ranges.fortune, fallback: FALLBACKS.fortune })
  const personality = softClampText(d?.personality || "", { ...ranges.personality, fallback: FALLBACKS.personality })
  const work = softClampText(d?.work || "", { ...ranges.work, fallback: FALLBACKS.work })
  const partner = softClampText(d?.partner || "", { ...ranges.partner, fallback: FALLBACKS.partner })
  return { fortune, personality, work, partner }
}

function pickSafeLines(lines: unknown): string[] {
  const xs = Array.isArray(lines) ? (lines as unknown[]) : []
  return xs
    .map((s) => (typeof s === "string" ? s.trim() : ""))
    .filter((s) => s.length > 0)
    .slice(0, 6) // 3〜5本程度推奨（最大6本まで）
}

export async function POST(req: Request) {
  try {
    const pending = (await req.json()) as Pending

    const openai = getOpenAI()
    if (!openai) throw new Error("openai_env_missing")

    const model = process.env.OPENAI_PROFILE_MODEL || "gpt-5-mini"

    const system = `あなたは「ルネア」。日本語で簡潔に、あたたかく、断定しすぎないトーンで話します。
出力は必ず厳密な JSON のみ。本文中にラベルや箇条書きや装飾を入れず、改行や引用符は JSON として正しい形式で。`

    // ← プロンプトを外部関数で生成（ハイブリッド条件も内包）
    const user = buildProfilePrompt(pending)

    const resp = await openai.chat.completions.create({
      model,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: JSON.stringify(user) },
      ],
      temperature: 0.7,
    })

    const raw = resp.choices?.[0]?.message?.content || "{}"
    let parsed: AiJson | null = null
    try {
      parsed = JSON.parse(raw) as AiJson
    } catch {
      parsed = null
    }

    // 入力に応じたレンジでサニタイズ（切り詰め/補完）
    const ranges = getRanges(pending)
    const detail = sanitizeDetail(parsed?.detail, ranges)

    const luneaLines = (() => {
      const xs = pickSafeLines(parsed?.luneaLines)
      if (xs.length >= 3) return xs
      // フォールバック（足りない時はdetailから拝借）
      const add: string[] = []
      if (detail.fortune) add.push(detail.fortune.slice(0, 60))
      if (detail.personality) add.push(detail.personality.slice(0, 60))
      if (add.length === 0) {
        add.push("…観測中。きみの“いま”を読み解いているよ。")
        add.push("今日の一歩は小さくていい。熱が冷める前に、1つだけ動かそう。")
      }
      return pickSafeLines([...xs, ...add])
    })()

    const resBody = {
      ok: true,
      result: {
        name: pending?.name || "",
        luneaLines,
        detail,
        theme: pending?.theme || null,
      },
    }

    return NextResponse.json(resBody)
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "failed" },
      { status: 500 },
    )
  }
}
console.log("Model in use:", process.env.OPENAI_PROFILE_MODEL)
