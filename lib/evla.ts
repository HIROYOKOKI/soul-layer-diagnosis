// lib/evla.ts の末尾あたり（toUi はそのまま）
// ============ 本番版（GPT利用、失敗時はテンプレへ） ============
export async function toUiProd(
  evla: EvlaLog
): Promise<UiResult & { __source: "disabled" | "gpt" | "template" }> {
  const base = THEME_HINTS[evla.theme];

  // フラグOFFなら明示的に disabled
  if (process.env.USE_OPENAI !== "true") {
    const ui = toUi(evla);
    return Object.assign(ui, { __source: "disabled" });
  }

  const sys =
    "あなたは前向きな行動コーチ。日本語で簡潔に、断定的診断や医療表現は禁止。";
  const user = `
[仕様]
- コメント(100-150字)
- アドバイス(100-150字)
- アファメーション(15-30字)

[文脈]
- テーマ: ${evla.theme}
- 目標E: ${evla.E.goal} / ヒント: ${base.eExplain}
- 候補V: ${evla.V.map(v => `${v.id}:${v.label}`).join(", ")}
- 選択Λ: ${evla.Lambda.pick} / 理由: ${evla.Lambda.reason}

JSONで返答: {"comment":"","advice":"","affirm":""}
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

    // 念のためパース保険（空文字や不正JSONに対応）
    const txt = (r as any).output_text ?? "";
    let parsed: any = {};
    try {
      parsed = txt ? JSON.parse(txt) : {};
    } catch {
      parsed = {};
    }

    const ui: UiResult = {
      comment: clampLen(parsed.comment ?? base.eExplain, 100, 150),
      advice: clampLen(parsed.advice ?? base.advice, 100, 150),
      affirm: clampLen(parsed.affirm ?? base.affirm[0], 15, 30),
      score: evla.slot === "morning" ? 0.3 : evla.slot === "noon" ? 0.2 : 0.1,
    };

    return Object.assign(ui, { __source: "gpt" });
  } catch (e) {
    // 失敗時はテンプレへフォールバック（ログはAPI側で拾える）
    const ui = toUi(evla);
    return Object.assign(ui, { __source: "template" });
  }
}
