import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MyPage() {
  const sb = createServerComponentClient({ cookies });
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return <main className="p-6 text-white">ログインしてください</main>;

  // 最新 daily_results を取得（updated_at 優先、なければ created_at）
  let latest = await sb
    .from("daily_results")
    .select("question_id, comment, quote, created_at, updated_at")
    .eq("user_id", user.id)
    .eq("env", "prod")
    .order("updated_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latest.error && /updated_at/i.test(latest.error.message)) {
    latest = await sb
      .from("daily_results")
      .select("question_id, comment, quote, created_at")
      .eq("user_id", user.id)
      .eq("env", "prod")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
  }

  const row = latest.data ?? null;
  const ts = row?.updated_at ?? row?.created_at ?? null;
  const tsText = ts ? new Date(ts).toLocaleString("ja-JP") : "—";

  return (
    <main className="mx-auto max-w-md p-5 text-white space-y-6">
      <header>
        <h1 className="text-2xl font-bold">MY PAGE</h1>
        <p className="text-sm text-white/60 mt-1">あなたの軌跡と、いまを映す</p>
      </header>

      {/* 直近のメッセージ */}
      <section className="rounded-xl border border-white/15 p-4 bg-white/5 space-y-3">
        <div className="text-sm text-white/60">直近のメッセージ</div>
        <div className="text-xs text-white/50">
          {row?.question_id ?? "—"}（{tsText}）
        </div>
        <div className="leading-relaxed">{row?.comment ?? "—"}</div>
        <blockquote className="text-xl mt-1">“{row?.quote ?? "今日は静かに進む"}”</blockquote>
      </section>
    </main>
  );
}
