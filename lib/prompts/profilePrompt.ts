// lib/prompts/profilePrompt.ts

export type ProfilePending = {
  name: string
  birthday: string // "YYYY-MM-DD"
  birthTime?: string | null
  birthPlace?: string | null
  gender?: "Male" | "Female" | "Other" | string | null // 旧フィールド互換
  sex?: string | null                                    // 新フィールド（どちらでもOK）
  blood?: "A" | "B" | "O" | "AB" | string | null        // 旧UI互換
  preference?: string | null
  theme?: string | null
}

/* -----------------------------
   Numerology: Life Path Number
   - 11 / 22 / 33 はマスターナンバーとして確定
-------------------------------- */
function calcLifePathNumber(birthday: string): number | null {
  if (!birthday) return null
  const digits = birthday.replace(/[^0-9]/g, "").split("").map(Number)
  if (digits.length < 7) return null
  let sum = digits.reduce((a, b) => a + b, 0)
  const isMaster = (n: number) => n === 11 || n === 22 || n === 33
  while (sum > 9 && !isMaster(sum)) {
    sum = String(sum).split("").map(Number).reduce((a, b) => a + b, 0)
  }
  return sum
}

function lifePathLabel(n: number | null): string | null {
  if (n == null) return null
  const map: Record<number, string> = {
    1: "1（自立・開拓）",
    2: "2（調和・共創）",
    3: "3（表現・創造）",
    4: "4（基盤・実直）",
    5: "5（自由・変化）",
    6: "6（献身・育成）",
    7: "7（探究・精神）",
    8: "8（成果・統率）",
    9: "9（包容・普遍）",
    11: "11（直観・霊性）",
    22: "22（具現・大計画）",
    33: "33（無償の愛・奉仕）",
  }
  return map[n] ?? String(n)
}

/* -----------------------------
   Western Sun Sign (太陽星座)
   - うるう年など細部は簡易処理（境界1日誤差の可能性あり）
-------------------------------- */
type SunSign =
  | "Aries" | "Taurus" | "Gemini" | "Cancer" | "Leo" | "Virgo"
  | "Libra" | "Scorpio" | "Sagittarius" | "Capricorn" | "Aquarius" | "Pisces"

function getSunSign(birthday: string): SunSign | null {
  if (!birthday) return null
  const m = birthday.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return null
  const month = parseInt(m[2], 10)
  const day = parseInt(m[3], 10)

  // 境界は一般的な目安日付
  if ((month === 3  && day >= 21) || (month === 4  && day <= 19)) return "Aries"
  if ((month === 4  && day >= 20) || (month === 5  && day <= 20)) return "Taurus"
  if ((month === 5  && day >= 21) || (month === 6  && day <= 21)) return "Gemini"
  if ((month === 6  && day >= 22) || (month === 7  && day <= 22)) return "Cancer"
  if ((month === 7  && day >= 23) || (month === 8  && day <= 22)) return "Leo"
  if ((month === 8  && day >= 23) || (month === 9  && day <= 22)) return "Virgo"
  if ((month === 9  && day >= 23) || (month === 10 && day <= 23)) return "Libra"
  if ((month === 10 && day >= 24) || (month === 11 && day <= 22)) return "Scorpio"
  if ((month === 11 && day >= 23) || (month === 12 && day <= 21)) return "Sagittarius"
  if ((month === 12 && day >= 22) || (month === 1  && day <= 19)) return "Capricorn"
  if ((month === 1  && day >= 20) || (month === 2  && day <= 18)) return "Aquarius"
  if ((month === 2  && day >= 19) || (month === 3  && day <= 20)) return "Pisces"
  return null
}

/* -----------------------------
   Public: Build Prompt Object
-------------------------------- */
export function buildProfilePrompt(pending: ProfilePending) {
  const hasAstro = Boolean(pending?.birthTime && pending?.birthPlace)

  // Signals we embed as “facts” for the model
  const lp = calcLifePathNumber(pending.birthday)
  const lpLabel = lifePathLabel(lp)
  const sun = getSunSign(pending.birthday)

  return {
    instruction: "以下のプロフィールから、診断結果をJSONで返してください。",
    constraints: {
      // ハイブリッド（ホロスコープ × 数秘術）
      fortune: hasAstro
        ? "200〜250文字（±20字）。太陽星座の運勢に、出生時間・出生地からの月/アセンダント/MCの影響を1〜2文補足する。"
        : "150〜200文字（±20字）。誕生日から推定される太陽星座を基盤に総合運勢を述べる。",
      personality: hasAstro
        ? "200〜250文字（±20字）。数秘術（ライフパス）を土台に、月/アセンダントのニュアンスを1〜2文補足する。"
        : "150〜200文字（±20字）。数秘術（ライフパス）に基づく性格傾向を述べる。",
      work: hasAstro
        ? "100〜120文字（±20字）。数秘術（使命/適職）を基盤に、天体配置の補足を短く添える。"
        : "80〜100文字（±20字）。数秘術（使命/適職）に基づく仕事傾向を述べる。",
      partner: hasAstro
        ? "100〜120文字（±20字）。太陽ベースの相性に、月/金星の示唆を短く補足し理想像を述べる。"
        : "80〜100文字（±20字）。太陽星座ベースの相性から理想のパートナー像を述べる。",
      luneaLines:
        "3〜5行。1行は短文（15〜60文字程度）。観測→主文→助言→締め、の流れが望ましい。",
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
    // ← ここが埋め込み拡張：モデルに渡す“参考事実”
    signals: {
      numerology: {
        life_path: lp,                 // ex) 33
        life_path_label: lpLabel,      // ex) "33（無償の愛・奉仕）"
        note: "数秘術ライフパス。文章では専門用語を避け、一般向けに自然に言い換えること。",
      },
      astrology: {
        has_birth_time_and_place: hasAstro,
        sun_sign: sun,                 // ex) "Taurus"
        note: "太陽は性質の土台。必要なら月・ASCを示唆として自然文に変換（専門語は控えめ）。",
      },
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
}
