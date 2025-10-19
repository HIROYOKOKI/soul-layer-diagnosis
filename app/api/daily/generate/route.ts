// app/api/daily/generate/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";

type EV = "E" | "V" | "Λ" | "Ǝ";
type Slot = "morning" | "noon" | "night";
type Env = "dev" | "prod";
type Theme = "WORK" | "LOVE" | "FUTURE" | "LIFE";

export async function POST(req: Request) {
  // —— ここから下は「関数内に全て閉じる」：モジュール初期化時に評価されるものを置かない
  try {
    const THEMES: Theme[] = ["WORK", "LOVE", "FUTURE", "LIFE"];
    const SLOT_COUNTS: Record<Slot, number> = { morning: 4, noon: 3, night: 2 };

    const body = await req.json().catch(() => ({} as any));
    const slot = (body?.slot ?? "morning") as Slot;
    const env = (body?.env ?? "prod") as Env;
    const n = SLOT_COUNTS[slot] ?? 4;

    const d = new Date();
    const pad = (x: number) => String(x).padStart(2, "0");
    const id = `daily-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${slot}`;

    // ——— テーマ解決（MyPage同期 or フォールバック）
    async function resolveTheme(): Promise<Theme> {
      const normalized = String(body?.theme ?? "").trim().toUpperCase();
      if (THEMES.includes(normalized as Theme)) return normalized as Theme;

      try {
        const origin = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin;
        const r = await fetch(`${origin}/api/theme`, {
          cache: "no-store",
          headers: { cookie: req.headers.get("cookie") ?? "" },
        });
        if (r.ok) {
          const j = await r.json().catch(() => ({} as any));
          const t = String(j?.scope ?? j?.theme ?? "").trim().toUpperCase();
          if (THEMES.includes(t as Theme)) return t as Theme;
        }
      } catch {
        /* noop */
      }
      return "LOVE";
    }
    const theme = await resolveTheme();

    // ——— フォールバック
    let text = "いまのあなたの重心はどれに近い？";
    const defaultOptions = (): { key: EV; label: string }[] => [
      { key: "E", label: "意志（E）" },
      { key: "V", label: "感受（V）" },
      { key: "Λ", label: "構築（Λ）" },
      { key: "Ǝ", label: "反転（Ǝ）" },
    ].slice(0, Math.max(2, Math.min(4, n)));
    let options = defaultOptions();

    const sanitizeOptions = (arr: any): { key: EV; label?: string }[] => {
      const ok = new Set<EV>(["E", "V", "Λ", "Ǝ"]);
      const list = Array.isArray(arr)
        ? arr
            .map((o) =>
              o && typeof o.key === "string"
                ? ({ key: o.key as EV, label: typeof o.label === "string" ? o.label : undefined } as const)
                : null
            )
            .filter((o) => o && ok.has(o.key as EV)) as any
        : [];
      const seen = new Set<string>();
      const uniq = list.filter((o: any) => {
        if (seen.has(o.key)) return false;
        seen.add(o.key);
        return true;
      });
      for (const o of defaultOptions()) {
        if (uniq.length >= n) break;
        if (!seen.has(o.key)) {
          uniq.push(o);
          seen.add(o.key);
        }
      }
      return uniq.slice(0, n);
    };

    // ——— OpenAI 呼び出し（JSON強制 & 1回リトライ）
    async function callOnce() {
      const openai = getOpenAI();
      if (!openai) throw new Error("openai_env_missing");

      const sys =
        "あなたは日本語で短い設問を作るアシスタントです。\n" +
        "出力は必ず JSON 1オブジェクトのみ。コードブロックや説明は出さない。\n" +
        'スキーマ: {"text": string, "options": [{"key":"E|V|Λ|Ǝ","label": string}...]}';

      const user =
        `目的: EVΛƎ（E/V/Λ/Ǝ）のうち ${n} 個を選択肢として出す短い設問を作成。\n` +
        `制約: 文章は80字以内。日常の言い回しで。テーマは ${theme}。\n` +
        `選択肢: key は E|V|Λ|Ǝ のいずれか。label は省略せず自然文で。\n` +
        `slot=${slot}\n` +
        `出力: 上記スキーマの JSON オブジェクトのみ（前後の文章・マークダウン禁止）`;

      const r = await openai.chat.completions.create({
        model: "gpt-5-mini",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: user },
        ],
        temperature: 0.7,
        response_format: { type: "json_object" },
      });

      const content = (r?.choices?.[0]?.message?.content ?? "").trim();
      if (!content) throw new Error("empty_openai_response");

      let parsed: any;
      try {
        parsed = JSON.parse(content);
      } catch {
        const jsonText =
          content.match(/```json([\s\S]*?)```/i)?.[1]?.trim() ||
          content.match(/```([\s\S]*?)```/i)?.[1]?.trim() ||
          content;
        parsed = JSON.parse(jsonText);
      }

      const textRaw =
        typeof parsed?.text === "string"
          ? parsed.text
          : typeof parsed?.question === "string"
          ? parsed.question
          : null;
      if (!textRaw) throw new Error("missing_text_in_response");

      return { text: textRaw as string, options: sanitizeOptions(parsed?.options) };
    }

    try {
      const a = await callOnce();
      text = a.text;
      options = a.options;
    } catch (e1: any) {
      console.error("daily.generate.error#1", { err: e1?.message ?? String(e1), slot, theme, n });
      try {
        const b = await callOnce();
        text = b.text;
        options = b.options;
      } catch (e2: any) {
        console.error("daily.generate.error#2", { err: e2?.message ?? String(e2), slot, theme, n });
      }
    }

    return NextResponse.json(
      {
        ok: true,
        id,
        slot,
        env,
        theme,
        text,
        options,
        ts: new Date().toISOString(),
      },
      { headers: { "cache-control": "no-store" } }
    );
  } catch (e: any) {
    // ここに来るのは本当に稀（モジュール初期化ではなくハンドラ内の例外）
    console.error("daily.generate.fatal", e?.message ?? e);
    return NextResponse.json({ ok: false, error: e?.message ?? "internal_error" }, { status: 200 });
  }
}
