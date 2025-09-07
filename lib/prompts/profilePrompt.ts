// lib/prompts/profilePrompt.ts
export type ProfilePending = {
  name: string
  birthday: string
  birthTime?: string | null
  birthPlace?: string | null
  sex?: string | null
  preference?: string | null
  theme?: string | null
}

export function buildProfilePrompt(pending: ProfilePending) {
  const hasAstro = pending?.birthTime && pending?.birthPlace

  return {
    instruction: "以下のプロフィールから、診断結果をJSONで返してください。",
    constraints: {
      fortune: hasAstro
        ? "200〜250文字（±20字）。誕生日に基づく太陽星座の運勢に加え、出生時間と出生地から得られる月やアセンダント、MCの影響を補足してください。"
        : "150〜200文字（±20字）。誕生日に基づく太陽星座から総合運勢を述べてください。",
      personality: hasAstro
        ? "200〜250文字（±20字）。誕生日から算出できる数秘術（ライフパスナンバー）を基盤に、出生時間・出生地がある場合は月やアセンダントのニュアンスを補足してください。"
        : "150〜200文字（±20字）。誕生日から算出できる数秘術（ライフパスナンバー）に基づき性格傾向を述べてください。",
      work: hasAstro
        ? "100〜120文字（±20字）。誕生日から算出する数秘術（使命・適職傾向）を基盤に、出生時間・出生地がある場合は天体配置を補足してください。"
        : "80〜100文字（±20字）。誕生日から算出する数秘術（使命・適職傾向）に基づいてください。",
      partner: hasAstro
        ? "100〜120文字（±20字）。誕生日から見た太陽星座ベースの相性に加え、月や金星の配置を補足し理想のパートナー像を述べてください。"
        : "80〜100文字（±20字）。誕生日から見た太陽星座ベースで理想のパートナー像を述べてください。",
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
