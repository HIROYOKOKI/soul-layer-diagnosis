// app/api/profile/diagnose/route.ts
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

/* =========================
   Utils
   ========================= */

/** ライフパスナンバー（数秘術）の計算（11/22/33はマスターナンバー扱い） */
function calcLifePath(birthday: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthday || "")) return null
  const digits = birthday.replace(/-/g, "").split("").map(Number)
  let sum = digits.reduce((a, b) => a + b, 0)
  const isMaster = (n: number) => n === 11 || n === 22 || n === 33
  while (sum > 9 && !isMaster(sum)) {
    sum = String(sum).split("").map(Number).reduce((a, b) => a + b, 0)
  }
  return sum
}

/** 許容バッファつきの長さ調整（±tol字許容） */
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

/** 文字数レンジを「占星術リッチかどうか」で切り替えて整形 */
function sanitizeDetailDynamic(d: Partial<DiagnoseDetail> | undefined, hasAstro: boolean): DiagnoseDetail {
  const ranges = {
    fortune: hasAstro ? { min: 200, max: 250 } : { min: 150, max: 200 },
    personality: hasAstro ? { min: 200, max: 250 } : { min: 150, max: 200 },
    work: hasAstro ? { min: 100, max: 120 } : { min: 80, max: 100 },
    partner: hasAstro ? { min: 100, max: 120 } : { min: 80, max: 100 },
  }

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
    .slice(0, 6) // 3〜5本程度推奨（最大6まで）
}

/* =========================
   Handler
   ========================= */

export async function POST(req: Request) {
  try {
    const pending = (await req.json()) as Pending

    const openai = getOpenAI()
    if (!openai) throw new Error("openai_env_missing")

    const model = process.env.OPENAI_PROFILE_MODEL || "gpt-4o-mini"

    const hasAstro = Boolean(pending?.birthTime && pending?.birthPlace)
    const lifePath = calcLifePath(pending?.birthday || "")

    const system = `あなたは「ルネア」。日本語で簡潔に、あたたかく、断定しすぎないトーンで話します。
出力は必ず厳密な JSON のみ。本文中にラベルや箇条書きや装飾を入れず、改行や引用符は JSON として正しい形式で。`

    // ★ ハイブリッド仕様のプロンプト（数秘術×ホロスコープ／文字数レンジ分岐）
    const user = {
      instruction: "以下のプロフィールから、診断結果をJSONで返してください。",
      constraints: {
        fortune: hasAstro
          ? "200〜250文字（±20字）。誕生日に基づく太陽星座の運勢に加え、出生時間と出生地から得られる月やアセンダント、MCの影響を1〜2文で補足してください。専門用語は平易に。"
          : "150〜200文字（±20字）。誕生日に基づく太陽星座から総合運勢を述べてください。専門用語は避け、日常の行動に落ちる表現で。",
        personality: hasAstro
          ? "200〜250文字（±20字）。数秘術（ライフパスナンバー）を基盤に、月やアセンダントのニュアンスを1文程度で補足してください。断定しすぎず具体例を控えめに。"
          : "150〜200文字（±20字）。数秘術（ライフパスナンバー）に基づき性格傾向を述べてください。断定しすぎず、励ましのトーンで。",
        work: hasAstro
          ? "100〜120文字（±20字）。数秘術（使命・適職傾向）を基盤に、天体配置から仕事のリズム・集中しやすいタイミング等を一言補足。"
          : "80〜100文字（±20字）。数秘術（使命・適職傾向）に基づき仕事の進め方のコツを簡潔に。",
        partner: hasAstro
          ? "100〜120文字（±20字）。太陽星座ベースに月・金星の雰囲気を補足し、理想の関係性をやわらかく描写。断定語は避ける。"
          : "80〜100文字（±20字）。太陽星座ベースで相性の良い傾向を述べ、関係づくりのヒントを一言で。",
        luneaLines:
          "3〜5行。1行は短文（15〜60文字程度）。観測→主文→助言→締め、の流れ。装飾なし。ルネアの口調でやさしく。",
        style: "やさしい・断定しすぎない・比喩は控えめ・日常に落としやすい言い回し",
        avoid: "デリケートな医療・差別的表現・占い断定語",
      },
      profile: {
        name: pending?.name,
        birthday: pending?.birthday,
        birthTime: pending?.birthTime ?? null,
        birthPlace: pending?.birthPlace ?? null,
        sex: pending?.sex ?? null,
        preference: pending?.preference ?? null,
        numerology: lifePath ? { lifePath } : null, // ★ 数秘結果を明示的に渡す
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
    try { parsed = JSON.parse(raw) as AiJson } catch { parsed = null }

    // 文字数レンジに合わせて整形
    const detail = sanitizeDetailDynamic(parsed?.detail, hasAstro)

    // セーフティ：luneaLines が弱いときは detail から補完
    const luneaLines = (() => {
      const xs = pickSafeLines(parsed?.luneaLines)
      if (xs.length >= 3) return xs
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
      { status: 500 }
    )
  }
}
