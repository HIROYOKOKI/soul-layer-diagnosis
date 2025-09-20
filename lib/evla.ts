export async function toUiProd(
  evla: EvlaLog
): Promise<UiResult & { __source: "disabled" | "gpt" | "template" }> {
  const base = THEME_HINTS[evla.theme];

  if (process.env.USE_OPENAI !== "true") {
    const ui = toUi(evla);
    return Object.assign(ui, { __source: "disabled" });
  }

  const sys = "あなたは前向きな行動コーチ。日本語で簡潔に、断定的診断や医療表現は禁止。";
  const user = `...`.trim();

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

    const txt = (r as any).output_text ?? "";
    let parsed: any = {};
    try { parsed = txt ? JSON.parse(txt) : {}; } catch { parsed = {}; }

    const ui: UiResult = {
      comment: clampLen(parsed.comment ?? base.eExplain, 100, 150),
      advice:  clampLen(parsed.advice  ?? base.advice,  100, 150),
      affirm:  clampLen(parsed.affirm  ?? base.affirm[0], 15, 30),
      score: evla.slot === "morning" ? 0.3 : evla.slot === "noon" ? 0.2 : 0.1,
    };
    return Object.assign(ui, { __source: "gpt" });
  } catch (e) {
    const ui = toUi(evla);
    return Object.assign(ui, { __source: "template" });
  }
}
