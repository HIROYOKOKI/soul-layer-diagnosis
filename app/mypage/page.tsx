// app/mypage/page.tsx
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import ThemeCardClient from "./ThemeCardClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function fmt(ts?: string | null) {
  if (!ts) return "—";
  const d = new Date(ts);
  const p2 = (n: number) => String(n).toString().padStart(2, "0");
  return `${d.getFullYear()}/${p2(d.getMonth() + 1)}/${p2(d.getDate())} ${p2(d.getHours())}:${p2(d.getMinutes())}`;
}

export default async function MyPage() {
  // ✅ Next.js 15 は await 必須
  const jar = await cookies();
  const supabase = createServerComponentClient({ cookies: () => jar });

  // Cookie "theme" が dev のときだけ dev、無ければ prod
  const env = (jar.get("theme")?.value === "dev" ? "dev" : "prod") as "dev" | "prod";

  // 認証チェック（未ログインでも 500 にしない）
  const { data: userResp } = await supabase.auth.getUser();
  const user = userResp?.user ?? null;
  if (!user) {
    return (
      <main className="p-6 text-white">
        ログインしてください
      </main>
    );
  }

  // 最新 daily_results を取得（旧スキーマ互換あり）
  let row:
    | {
        question_id?: string | null;
        code?: string | null;
        comment?: string | null;
        quote?: string | null;
        created_at?: string | null;
        updated_at?: string | null;
        env?: "dev" | "prod" | null;
      }
    | null = null;

  try {
    const { data, error } = await supabase
      .from("daily_results")
      .select("question_id, code, comment, quote, created_at, updated_at, env")
      .eq("user_id", user.id)
      .eq("env", env)
      .order("updated_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    row = data ?? null;

    if (!row) {
      const { data: data2 } = await supabase
        .from("daily_results")
        .select("question_id, code, comment, quote, created_at, env")
        .eq("user_id", user.id)
        .eq("env", env)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      row = data2 ?? null;
    }
  } catch (e) {
    // サーバーは落とさず空表示に
    row = row ?? null;
  }

  const ts = (row?.updated_at || row?.created_at) ?? null;

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-5 text-white">
      <header>
        <h1 className="text-2xl font-bold">MY PAGE</h1>
        <p className="mt-1 text-sm text-white/60">あなたの軌跡と、いまを映す</p>
      </header>

      {/* /theme/confirm で保存したテーマをクライアントで表示 */}
      <ThemeCardClient />

      {/* 直近メッセージ */}
      <section className="space-y-3 rounded-xl border border-white/15 bg-white/5 p-4">
        <div className="text-sm text-white/60">直近のメッセージ（env: {env}）</div>
        <div className="text-xs text-white/50">
          {row?.question_id ?? "—"}（{fmt(ts)}）
        </div>
        <div className="leading-relaxed">{row?.comment ?? "—"}</div>
        <blockquote className="mt-1 text-xl">“{row?.quote ?? "今日は静かに進む"}”</blockquote>
      </section>
    </main>
  );
}
