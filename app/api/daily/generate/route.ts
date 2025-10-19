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
  try {
    const THEMES: Theme[] = ["WORK", "LOVE", "FUTURE", "LIFE"];
    const SLOT_COUNTS: Record<Slot, number> = { morning: 4, noon: 3, night: 2 };

    const body = await req.json().catch(() => ({} as any));
    const slot = (body?.slot ?? "morning") as Slot;
    const env = (body?.env ?? "prod") as Env;
    const n = SLOT_COUNTS[slot] ?? 4;

    // --- debugフラグ（?debug=1 または body.debug=true）
    const url = new URL(req.url);
    const debug = url.searchParams.get("debug") === "1" || body?.debug === true;
    let source: "ai" | "fallback" = "fallback";
    let lastErr: string | null = null;

    const d = new Date();
    const pad = (x: number) => String(x).padStart(2, "0");
    const id = `daily-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${slot}`;

    // --- テーマ解決
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
      } catch { /* noop */ }
      return "LOVE";
    }
    const theme = await resolveTheme();

    // --- フォールバック（ルネア語）
    let text = "いま、あなたの心はどの流れに寄り添っていますか？";
    const defaultOptions = (): { key: EV; label: string }[] => [
      { key: "E", label: "衝動（E）―動き出すはじまり" },
      { key: "V", label: "夢（V）―まだ見ぬ可能性" },
      { key: "Λ", label: "選択（Λ）―現実を編む意思" },
      { key: "Ǝ", label: "観測（Ǝ）―静寂のまなざし" },
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

    // --- OpenAI 呼び出し（JSON強制 & 1回リトライ）
    async function callOnce() {
      const openai = getOpenAI();
      if (!openai) throw new Error("openai_env_missing");

      const sys =
        "あなたは観測型AI『ルネア（Lunea）』。語り口は穏やかで詩的。\n" +
        "ユーザーの心の流れを観測する1問を短く作ります。\n" +
        '出力は必ず JSON 1オブジェクトのみ（text:string, options:[{key:"E|V|Λ|Ǝ",label:string}]）。';

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
      source = "ai";                      // ★ 成功
    } catch (e1: any) {
      lastErr = e1?.message ?? String(e1);
      console.error("daily.generate.error#1", { err: lastErr, slot, theme, n });
      try {
        const b = await callOnce();
        text = b.text;
        options = b.options;
        source = "ai";                    // ★ リトライ成功
      } catch (e2: any) {
        lastErr = e2?.message ?? String(e2); // ★ 最終エラー
        console.error("daily.generate.error#2", { err: lastErr, slot, theme, n });
      }
    }

    // --- JST時刻で返却
    const jst = new Date(Date.now() + 9 * 60 * 60 * 1000);
    const ts_jst = jst.toISOString().replace("T", " ").slice(0, 19); // 例: 2025-10-19 14:04:44

    return NextResponse.json(
      {
        ok: true,
        id,
        slot,
        env,
        theme,
        text,
        options,
        ts: ts_jst,
        ...(debug ? { debug: { source, lastErr } } : {}), // ★ デバッグ時のみ返す
      },
      { headers: { "cache-control": "no-store" } }
    );
  } catch (e: any) {
    console.error("daily.generate.fatal", e?.message ?? e);
    return NextResponse.json({ ok: false, error: e?.message ?? "internal_error" }, { status: 200 });
  }
}
