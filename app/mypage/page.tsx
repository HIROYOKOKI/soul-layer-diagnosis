// app/mypage/page.tsx

import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

export const dynamic = "force-dynamic";
export const revalidate = 0;


import SyncThemeButton from "./SyncThemeButton";

type DR = {
  question_id: string;
  code: "E" | "V" | "Λ" | "Ǝ" | null;
  comment: string | null;
  quote: string | null;
  created_at: string | null;
  updated_at?: string | null; // なくてもOK（後方互換）
};

export default async function MyPage() {
  const sb = createServerComponentClient({ cookies });
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return <main className="p-6 text-white">ログインしてください</main>;

  // --- 最新 daily を取得（updated_at を優先、無ければ created_at）
  // PostgREST は複数 order をサポート。updated_at が無いDBでも動くように try/catch でフォールバック
  let latest: DR | null = null;

  // まずは updated_at desc, created_at desc の多段 order を試す
  const q1 = sb
    .from("daily_results")
    .select("question_id, code, comment, quote, created_at, updated_at")
    .eq("user_id", user.id)
    .eq("env", "prod")
    .order("updated_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let r1 = await q1;
  if (r1.error && /column .*updated_at/.test(r1.error.message)) {
    // updated_at が存在しないスキーマの場合のフォールバック
    r1 = await sb
      .from("daily_results")
      .select("question_id, code, comment, quote, created_at")
      .eq("user_id", user.id)
      .eq("env", "prod")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
  }
  latest = (r1.data as DR) ?? null;

  // --- DBのテーマ
  const { data: profile } = await sb
    .from("profiles")
    .select("theme")
    .eq("id", user.id)
    .maybeSingle();

  // --- Cookieのテーマ（ズレ検出）
  const jar = cookies();
  const cookieTheme = jar.get("theme")?.value ?? null;
  const profileTheme = (profile as any)?.theme ?? null;
  const themeMismatch = cookieTheme && cookieTheme !== profileTheme;

  const ts =
    latest?.updated_at ??
    latest?.created_at ??
    null;
  const tsText = ts ? new Date(ts).toLocaleString("ja-JP") : "—";

  return (
    <main className="mx-auto max-w-md p-5 text-white space-y-6">
      <header>
        <h1 className="text-2xl font-bold">MY PAGE</h1>
        <p className="text-sm text-white/60 mt-1">あなたの軌跡と、いまを映す</p>
      </header>

      {/* テーマ */}
      <section className="rounded-xl border border-white/15 p-4 bg-white/5 space-y-2">
        <div className="text-sm text-white/60">現在のテーマ（DB）</div>
        <div className="text-lg">{profileTheme ?? "—"}</div>
        <div className="text-xs text-white/50">{new Date().toLocaleString("ja-JP")}</div>

        {themeMismatch && (
          <div className="mt-2 rounded-lg border border-amber-400/40 bg-amber-400/10 p-3">
            <div className="text-sm text-amber-200">
              表示ズレ：Cookie「{cookieTheme}」 ≠ DB「{profileTheme ?? "—"}」
            </div>
            <SyncThemeButton theme={cookieTheme!} />
          </div>
        )}
      </section>

      {/* 最新のデイリー（daily_results 起点） */}
      <section className="rounded-xl border border-white/15 p-4 bg-white/5 space-y-3">
        <div className="text-sm text-white/60">直近のメッセージ</div>
        <div className="text-xs text-white/50">
          {latest?.question_id ?? "—"}（{tsText}）
        </div>

        <div className="text-sm text-white/60 mt-1">選択コード</div>
        <div className="text-lg">{latest?.code ?? "—"}</div>

        <div className="text-sm text-white/60 mt-1">診断コメント</div>
        <div className="leading-relaxed">
          {latest?.comment ?? "—"}
        </div>

        <div className="text-sm text-white/60 mt-1">アファメーション</div>
        <blockquote className="text-xl mt-1">“{latest?.quote ?? "今日は静かに進む"}”</blockquote>

        <div className="pt-3">
          <a
            href="/daily/question"
            className="inline-block rounded-lg border border-white/20 px-4 py-2 hover:bg-white/10"
          >
            次の一歩（デイリー診断）
          </a>
        </div>
      </section>
    </main>
  );
}
