// lib/evla.ts 内：toUiProd をこの実装に置き換え
export async function toUiProd(
  evla: EvlaLog
): Promise<UiResult & { __source: "disabled" | "gpt" | "template" }> {
  const base = THEME_HINTS[evla.theme];

  // フラグOFF → 明示的に disabled
  if (process.env.USE_OPENAI !== "true") {
    const ui = toUi(evla);
    return Object.assign(ui, { __source: "disabled" });
  }

  const sys =
    "あなたは前向きな行動コーチ。日本語で簡潔に、断定的診断や医療表現は禁止。ポジティブで具体的に。";
  const user = `
[仕様]
- コメント(100-150字): その時間帯に合う行動の流れを短く具体化
- アドバイス(100-150字): 今日すぐ実行できる一手を提案
- アファメーション(15-30字): 一行の自己肯定

[文脈]
- テーマ: ${evla.theme}
- スロット: ${evla.slot}
- 目標E: ${evla.E.goal} / ヒント: ${base.eExplain}
- 候補V: ${evla.V.map(v => `${v.id}:${v.label}`).join(", ")}
- 選択Λ: ${evla.Lambda.pick} / 理由: ${evla.Lambda.reason}

出力は次のJSONのみ：
{"comment":"","advice":"","affirm":""}
  `.trim();

  try {
    const { getOpenAI } = await import("@/lib/openai");
    const openai = getOpenAI();

    const r = await openai.responses.create({
      model: "gpt-4o-mini",
      input: [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
      temperature: 0.6,
    });

    // --- 念のためのパース保険 ---
    let text =
      (r as any).output_text ??
      (r as any).output?.[0]?.content?.[0]?.text ??
      "";
    let parsed: any = {};
    try {
      parsed = text ? JSON.parse(text) : {};
    } catch {
      parsed = {};
    }

    const ui: UiResult = {
      comment: clampLen(parsed.comment ?? base.eExplain, 100, 150),
      advice:  clampLen(parsed.advice  ?? base.advice,  100, 150),
      affirm:  clampLen(parsed.affirm  ?? base.affirm[0], 15, 30),
      score: evla.slot === "morning" ? 0.3 : evla.slot === "noon" ? 0.2 : 0.1,
    };

    return Object.assign(ui, { __source: "gpt" });
  } catch (e) {
    // 失敗時はテンプレへフォールバック
    const ui = toUi(evla);
    return Object.assign(ui, { __source: "template" });
  }
}
export {
  detectJstSlot,
  slotScoreWeight,
  rankPoint,
  seededPick,
  extractE,
  generateCandidates,
  choose,
  observeTemplate,
  nextV,
  toUi,
  toUiProd,
};
