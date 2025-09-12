import OpenAI from "openai";
const aiEnabled = process.env.DAILY_AI_ENABLED === "true";
const client = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

async function maybeLLMText(theme?: string): Promise<string | null> {
  if (!aiEnabled || !client) return null;
  try {
    const prompt = theme
      ? `テーマ: ${theme}。40文字以内の短いデイリー質問を日本語で1つ。文末の句読点は任意。`
      : `40文字以内の短いデイリー質問を日本語で1つ。`;
    const r = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 60,
      temperature: 0.7,
    });
    return r.choices[0]?.message?.content?.trim() || null;
  } catch {
    return null; // 失敗時は静かにフォールバック
  }
}
