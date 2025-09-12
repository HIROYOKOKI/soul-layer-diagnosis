import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

export default async function MyPage() {
  const sb = createServerComponentClient({ cookies });
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return <div>ログインしてください</div>;

  const { data: latest } = await sb
    .from("daily_results")
    .select("question_id, code, comment, quote, created_at")
    .eq("user_id", user.id)
    .eq("env", "prod")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <main className="mx-auto max-w-md p-5 space-y-4 text-white">
      <h1 className="text-2xl font-bold">マイページ</h1>
      <section className="rounded-xl border border-white/15 p-4 bg-white/5">
        <div className="text-sm text-white/60">最新のデイリー</div>
        <div className="mt-1 text-lg">{latest?.comment ?? "—"}</div>
        <blockquote className="mt-2 text-xl">“{latest?.quote ?? "今日は静かに進む"}”</blockquote>
        <div className="mt-2 text-xs text-white/50">{latest?.question_id ?? ""}</div>
      </section>
    </main>
  );
}
