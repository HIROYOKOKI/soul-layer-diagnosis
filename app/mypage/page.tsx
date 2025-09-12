// app/mypage/page.tsx
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

export const dynamic = "force-dynamic";

import SyncThemeButton from "./SyncThemeButton";

export default async function MyPage() {
  const sb = createServerComponentClient({ cookies });
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return <main className="p-6 text-white">ログインしてください</main>;

  // 最新 daily（env=prod）
  const { data: latest } = await sb
    .from("daily_results")
    .select("question_id, code, comment, quote, created_at")
    .eq("user_id", user.id)
    .eq("env", "prod")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // DBのテーマ
  const { data: profile } = await sb
    .from("profiles")
    .select("theme")
    .eq("id", user.id)
    .maybeSingle();

  // Cookieのテーマ（ズレ検出）
  const jar = cookies();
  const cookieTheme = jar.get("theme")?.value ?? null;
  const profileTheme = (profile as any)?.theme ?? null;
  const themeMismatch = cookieTheme && cookieTheme !== profileTheme;

  return (
    <main className="mx-auto max-w-md p-5 text-white space-y-6">
      <header>
        <h1 className="text-2xl font-bold">マイページ</h1>
        <p className="text-sm text-white/60 mt-1">ようこそ</p>
      </header>

      {/* テーマ */}
      <section className="rounded-xl border border-white/15 p-4 bg-white/5 space-y-2">
        <div className="text-sm text-white/60">現在のテーマ（DB）</div>
        <div className="text-lg">{profileTheme ?? "—"}</div>

        {themeMismatch && (
          <div className="mt-2 rounded-lg border border-amber-400/40 bg-amber-400/10 p-3">
            <div className="text-sm text-amber-200">
              表示ズレ：Cookie「{cookieTheme}」 ≠ DB「{profileTheme ?? "—"}」
            </div>
            <SyncThemeButton theme={cookieTheme!} />
          </div>
        )}
      </section>

      {/* 最新のデイリー */}
      <section className="rounded-xl border border-white/15 p-4 bg-white/5 space-y-3">
        <div className="text-sm text-white/60">最新のデイリー</div>
        <div className="text-xs text-white/50">
          {latest?.question_id ?? "—"}（{latest?.created_at ? new Date(latest.created_at).toLocaleString("ja-JP") : "—"}）
        </div>

        <div className="text-sm text-white/60">選択コード</div>
        <div className="text-lg">{latest?.code ?? "—"}</div>

        <div className="text-sm text-white/60 mt-1">診断コメント</div>
        <div className="leading-relaxed">{latest?.comment ?? "—"}</div>

        <div className="text-sm text-white/60 mt-1">アファメーション</div>
        <blockquote className="text-xl mt-1">“{latest?.quote ?? "今日は静かに進む"}”</blockquote>

        <div className="pt-3">
          <a href="/daily/question" className="inline-block rounded-lg border border-white/20 px-4 py-2 hover:bg-white/10">
            次の一歩（デイリー診断）
          </a>
        </div>
      </section>
    </main>
  );
}
