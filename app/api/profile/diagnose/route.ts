import { NextResponse } from "next/server"
import { getOpenAI } from "../../../../lib/openai"

type Pending = {
  name: string
  birthday: string
  birthTime?: string | null
  birthPlace?: string | null
  sex?: "Male" | "Female" | "Other" | null
  preference?: "Female" | "Male" | "Both" | "None" | "Other" | null
  theme?: string | null // dev / prod など任意
}

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

function sanitizeDetail(d?: Partial<DiagnoseDetail>): DiagnoseDetail {
  const fortune = softClampText(d?.fortune || "", { min: 150, max: 200, fallback: FALLBACKS.fortune })
  const personality = softClampText(d?.personality || "", { min: 150, max: 200, fallback: FALLBACKS.personality })
  const work = softClampText(d?.work || "", { min: 80, max: 100, fallback: FALLBACKS.work })
  const partner = softClampText(d?.partner || "", { min: 80, max: 100, fallback: FALLBACKS.partner })
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

    const model = process.env.OPENAI_PROFILE_MODEL || "gpt-4o-mini"

    const system = `あなたは「ルネア」。日本語で簡潔に、あたたかく、断定しすぎないトーンで話します。
出力は必ず厳密な JSON のみ。本文中にラベルや箇条書きや装飾を入れず、改行や引用符は JSON として正しい形式で。`

    const user = {
      instruction: "以下のプロフィールから、診断結果をJSONで返してください。",
      constraints: {
        fortune: "150〜200文字（±20文字許容）",
        personality: "150〜200文字（±20文字許容）",
        work: "80〜100文字（±20文字許容）",
        partner: "80〜100文字（±20文字許容）",
        luneaLines: "3〜5行。1行は短文（15〜60文字程度）。観測→主文→助言→締め、の流れが望ましい。",
        style: "やさしい・断定しすぎない・比喩は控えめ",
        avoid: "デリケートな医療・差別的表現・占い断定語",
      },
      profile: {
        name: pending?.name,
        birthday: pending?.birthday,
        birthTime: pending?.birthTime ?? null,
        birthPlace: pending?.birthPlace ?? null,
        sex: pending?.sex ?? null,
        preference: pending?.preference ?? null,
      },
      output_format: {
        type: "object",
        properties: {
          detail: {
            type: "object",
            properties: {
              fortune: { type: "string" },
              personality: { type: "string" },
              work: { type: "string" },
              partner: { type: "string" },
            },
            required: ["fortune", "personality", "work", "partner"],
            additionalProperties: false,
          },
          luneaLines: {
            type: "array",
            items: { type: "string" },
            minItems: 3,
            maxItems: 6,
          },
        },
        required: ["detail", "luneaLines"],
        additionalProperties: false,
      },
      note: "JSON以外は一切出力しないでください。",
    }

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

    const detail = sanitizeDetail(parsed?.detail)
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
