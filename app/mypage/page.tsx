import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import ThemeCardClient from "./ThemeCardClient"; // ← 追記：テーマ表示はクライアントで

export const dynamic = "force-dynamic";
export const revalidate = 0;

function fmt(ts?: string | null) {
  if (!ts) return "—";
  const d = new Date(ts);
  const p2 = (n: number) => String(n).toString().padStart(2, "0");
  return `${d.getFullYear()}/${p2(d.getMonth() + 1)}/${p2(d.getDate())} ${p2(d.getHours())}:${p2(d.getMinutes())}`;
}

export default async function MyPage() {
  // Next.js 15 では cookies() が async。sync 環境でも await は無害。
  const jar = await cookies();
  const sb = createServerComponentClient({ cookies: () => jar });

  // env は Cookie "theme" を使用（なければ "prod"）
  const env = (jar.get("theme")?.value === "dev" ? "dev" : "prod") as "dev" | "prod";

  const { data: { user } } = await sb.auth.getUser();
  if (!user) {
    return (
      <main className="p-6 text-white">
        ログインしてください
      </main>
    );
  }

  // 最新 daily_results を取得（updated_at → created_at フォールバック）
  let latest = await sb
    .from("daily_results")
    .select("question_id, code, comment, quote, created_at, updated_at")
    .eq("user_id", user.id)
    .eq("env", env)
    .order("updated_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latest.error && /updated_at/i.test(latest.error.message)) {
    latest = await sb
      .from("daily_results")
      .select("question_id, code, comment, quote, created_at")
      .eq("user_id", user.id)
      .eq("env", env)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
  }

  const row = latest.data ?? null;
  const ts = (row as any)?.updated_at ?? (row as any)?.created_at ?? null;

  return (
    <main className="mx-auto max-w-5xl p-5 text-white space-y-6">
      <header>
        <h1 className="text-2xl font-bold">MY PAGE</h1>
        <p className="mt-1 text-sm text-white/60">あなたの軌跡と、いまを映す</p>
      </header>

      {/* 現在のテーマ（ConfirmでsessionStorageに保存したものを読む） */}
      <ThemeCardClient />

      {/* 直近のメッセージ（Supabaseの最新デイリー） */}
      <section className="rounded-xl border border-white/15 bg-white/5 p-4 space-y-3">
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
