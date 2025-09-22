// app/api/daily/question/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getOpenAI } from "@/lib/openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type EV = "E" | "V" | "Λ" | "Ǝ";
type Slot = "morning" | "noon" | "night";
type Choice = { key: EV; label: string };

const FALLBACK: Record<Slot, Choice[]> = {
  morning: [
    { key: "E", label: "直感で素早く動く" },
    { key: "V", label: "理想のイメージから始める" },
    { key: "Λ", label: "条件を決めて選ぶ" },
    { key: "Ǝ", label: "一拍置いて様子を見る" },
  ],
  noon: [
    { key: "E", label: "勢いで一歩進める" },
    { key: "V", label: "可能性を広げる選択をする" },
    { key: "Λ", label: "目的に沿って最短を選ぶ" },
  ],
  night: [
    { key: "Ǝ", label: "今日は観測と整理に徹する" },
    { key: "V", label: "明日に向けて静かに構想する" },
  ],
};

// JST スロット判定
function getJstSlot(now = new Date()): Slot {
  // JST = UTC+9
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const h = jst.getUTCHours();
  // 朝=5:00-11:59 / 昼=12:00-17:59 / 夜=18:00-4:59
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 18) return "noon";
  return "night";
}

export async function GET() {
  const slot = getJstSlot();
  const choiceCount = slot === "morning" ? 4 : slot === "noon" ? 3 : 2;

  const questionId = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  // cookieに直近のquestionIdとslotを軽く保持（任意）
  const jar = cookies();
  jar.set("daily_question_id", questionId, { httpOnly: true, sameSite: "lax", path: "/" });
  jar.set("daily_slot", slot, { httpOnly: true, sameSite: "lax", path: "/" });

  // OpenAIで質問＋選択肢を生成（失敗時はフォールバック）
  try {
    const openai = getOpenAI();
    if (!openai) throw new Error("openai_env_missing");

    const sys = [
      "あなたは『ルネア（Lunea）』。観測型のナビAIとして、短くやさしい日本語で話す。",
      "タスク：デイリー診断の『1問（50〜100文字）』と、スロット数に応じた選択肢（各20〜50文字）を生成。",
      "表現は詩的すぎず自然。固有名詞や難語は避け、誰でもすぐ答えられる聞き方にする。",
      "出力は必ずJSONのみ（説明文なし）。",
    ].join("\n");

    const user = JSON.stringify({
      slot,
      choiceCount,
      constraints: {
        question: { min: 50, max: 100 },
        choice: { min: 20, max: 50 },
      },
      examples: {
        morning: "今のあなたに必要な最初の一歩はどれ？",
        noon: "このあと数時間で進めたい進路は？",
        night: "今日はどんな締めくくりが心地いい？",
      },
      schema: {
        type: "object",
        properties: {
          question: { type: "string" },
          choices: {
            type: "array",
            items: {
              type: "object",
              properties: { key: { enum: ["E", "V", "Λ", "Ǝ"] }, label: { type: "string" } },
              required: ["key", "label"],
            },
          },
        },
        required: ["question", "choices"],
      },
    });

    const resp = await openai.chat.completions.create({
      model: "gpt-5-mini",
      temperature: 0.7,
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    });

    const json = JSON.parse(resp.choices[0].message.content || "{}");
    let choices: Choice[] = Array.isArray(json.choices)
      ? json.choices.slice(0, choiceCount)
      : [];

    // 過不足対応＆キーの重複/順の補正
    const keys: EV[] = ["E", "V", "Λ", "Ǝ"];
    const need = choiceCount - choices.length;
    if (need > 0) {
      const fb = FALLBACK[slot];
      for (const c of fb) {
        if (choices.length >= choiceCount) break;
        if (!choices.find((x) => x.key === c.key)) choices.push(c);
      }
    }
    choices = choices.slice(0, choiceCount).map((c, i) => ({
      key: keys.includes(c.key) ? c.key : (["E", "V", "Λ", "Ǝ"][i] as EV),
      label: String(c.label ?? "").slice(0, 50),
    }));

    return NextResponse.json({
      ok: true,
      question_id: questionId,
      slot,
      question: String(json.question || "今日の一歩を選んでください。").slice(0, 100),
      choices,
      created_at: createdAt,
      env: "prod", // 本番運用時。テストは diagnose 側で theme:"dev" を付けて分離
    });
  } catch {
    return NextResponse.json(
      {
        ok: true,
        question_id: questionId,
        slot,
        question:
          slot === "morning"
            ? "今朝のあなたに合う始め方はどれ？（直感で選んで大丈夫）"
            : slot === "noon"
            ? "このあと数時間、どの方向で進めたい？"
            : "今日はどんな締めくくりがしっくり来る？",
        choices: FALLBACK[slot].slice(0, choiceCount),
        created_at: createdAt,
        env: "dev",
      },
      { status: 200 }
    );
  }
}
