// app/mypage/page.tsx
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import SyncThemeButton from "./SyncThemeButton";

export default async function MyPage() {
  const sb = createServerComponentClient({ cookies });
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return <main className="p-6 text-white">ログインしてください</main>;

  // 最新 daily（updated_at優先 → created_at）
  let latest = await sb
    .from("daily_results")
    .select("question_id, code, comment, quote, created_at, updated_at")
    .eq("user_id", user.id)
    .eq("env", "prod")
    .order("updated_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(1).maybeSingle();

  if (latest.error && /updated_at/i.test(latest.error.message)) {
    latest = await sb
      .from("daily_results")
      .select("question_id, code, comment, quote, created_at")
      .eq("user_id", user.id)
      .eq("env", "prod")
      .order("created_at", { ascending: false })
      .limit(1).maybeSingle();
  }
  const row = latest.data ?? null;
  const ts = row?.updated_at ?? row?.created_at ?? null;
  const tsText = ts ? new Date(ts).toLocaleString("ja-JP") : "—";

  return (
    <main className="mx-auto max-w-md p-5 text-white space-y-6">
      {/* ★ 目印：これが見えたらこのファイルが出ている */}
      <div data-debug="mypage-v4" className="text-[10px] text-emerald-400">mypage-v4</div>

      <header>
        <h1 className="text-2xl font-bold">MY PAGE</h1>
        <p className="text-sm text-white/60 mt-1">あなたの軌跡と、いまを映す</p>
      </header>

      <section className="rounded-xl border border-white/15 p-4 bg-white/5 space-y-3">
        <div className="text-sm text-white/60">直近のメッセージ</div>
        <div className="text-xs text-white/50">{row?.question_id ?? "—"}（{tsText}）</div>
        <div className="text-sm text-white/60 mt-1">診断コメント</div>
        <div className="leading-relaxed">{row?.comment ?? "—"}</div>
        <div className="text-sm text-white/60 mt-1">アファメーション</div>
        <blockquote className="text-xl mt-1">“{row?.quote ?? "今日は静かに進む"}”</blockquote>

        {/* ★ 一時：実データを露出（除霊センサー） */}
        <pre className="mt-2 text-[10px] text-white/50 bg-white/5 p-2 rounded">
          {JSON.stringify(row, null, 2)}
        </pre>
      </section>
    </main>
  );
}
