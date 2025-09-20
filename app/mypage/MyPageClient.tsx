// app/mypage/MyPageClient.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

/* =========================
   Types（最小・このページで必要分）
========================= */
type EV = "E" | "V" | "Λ" | "Ǝ";

type ProfileLatest = {
  fortune?: string | null;
  personality?: string | null;
  partner?: string | null;
  created_at?: string | null;
  base_model?: "EΛVƎ" | "EVΛƎ" | null;
  base_order?: EV[] | null;
} | null;

type DailyLatest = {
  slot?: "morning" | "noon" | "night" | null;
  theme?: string | null;      // DBは小文字（work/love/future/life）
  score?: number | null;
  comment?: string | null;
  advice?: string | null;
  affirm?: string | null;
  evla?: any | null;
  created_at?: string | null;
} | null;

/* =========================
   Utils
========================= */
const FALLBACK_USER = { name: "Hiro", idNoStr: "0001", avatar: "/icon-512.png" };

const fmt = (dt?: string | null) => {
  try {
    const d = dt ? new Date(dt) : new Date();
    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return "";
  }
};

function modelMeta(model: "EΛVƎ" | "EVΛƎ" | null) {
  if (model === "EΛVƎ") return { color: "#B833F5", label: "現実思考型（EΛVƎ）" };
  if (model === "EVΛƎ") return { color: "#FF4500", label: "未来志向型（EVΛƎ）" };
  return { color: "#888888", label: "タイプ未推定" };
}

const THEME_COLOR: Record<string, string> = {
  work: "#1E3A8A",   // V ブルー系
  love: "#B833F5",   // Ǝ パープル系
  future: "#FF4500", // E オレンジ系
  life: "#84CC16",   // Λ グリーン系
};

/* =========================
   Optional Charts (安全な遅延ロード)
========================= */
type ChartsMod = {
  RadarChart: React.ComponentType<{ values: any; size?: number }>;
  TimeSeriesChart: React.ComponentType<{ data: any[] }>;
};
async function loadCharts(): Promise<ChartsMod | null> {
  try {
    // プロジェクトに存在する場合のみ読み込む
    const mod = await import("@/components/charts/Charts");
    return {
      RadarChart: mod.RadarChart,
      TimeSeriesChart: mod.TimeSeriesChart,
    };
  } catch {
    return null;
  }
}

/* =========================
   Component
========================= */
export default function MyPageClient() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [profile, setProfile] = useState<ProfileLatest>(null);
  const [daily, setDaily] = useState<DailyLatest>(null);

  // Charts（存在しない環境でもビルドが落ちないよう遅延ロード）
  const [charts, setCharts] = useState<ChartsMod | null>(null);
  const [series, setSeries] = useState<any[] | null>(null);
  const [today, setToday] = useState<any | null>(null);
  const [range, setRange] = useState<7 | 30 | 90>(30);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const [pRes, dRes] = await Promise.all([
          fetch("/api/mypage/profile-latest", { cache: "no-store" }),
          fetch("/api/mypage/daily-latest", { cache: "no-store" }),
        ]);
        const [pJson, dJson] = await Promise.all([pRes.json(), dRes.json()]);
        if (!alive) return;

        if (!pJson?.ok) throw new Error(pJson?.error ?? "profile_latest_failed");
        if (!dJson?.ok) throw new Error(dJson?.error ?? "daily_latest_failed");

        setProfile(pJson.item ?? null);
        setDaily(dJson.item ?? null);
      } catch (e: any) {
        if (alive) setErr(e?.message ?? "load_failed");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    // Charts は存在する時だけ読み込む
    (async () => {
      const m = await loadCharts();
      if (!m) return;
      setCharts(m);
      try {
        const [tRes, sRes] = await Promise.all([
          fetch("/api/today", { cache: "no-store" }),
          fetch(`/api/series?days=${range}`, { cache: "no-store" }),
        ]);
        if (tRes.ok) setToday(await tRes.json());
        if (sRes.ok) setSeries(await sRes.json());
      } catch {
        /* no-op */
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  // range 変更時のみ再取得（Chartsがある場合のみ）
  useEffect(() => {
    (async () => {
      if (!charts) return;
      try {
        const sRes = await fetch(`/api/series?days=${range}`, { cache: "no-store" });
        if (sRes.ok) setSeries(await sRes.json());
      } catch {
        /* no-op */
      }
    })();
  }, [range, charts]);

  // モデル推定（ある場合のみ表示）
  const model = (profile?.base_model as "EΛVƎ" | "EVΛƎ" | null) ?? null;
  const meta = modelMeta(model);

  // テーマチップ
  const themeKey = (daily?.theme ?? "").toLowerCase();
  const themeColor = THEME_COLOR[themeKey] ?? "#666";

  // Slot表記
  const slotJp = useMemo(() => {
    if (!daily?.slot) return "-";
    return daily.slot === "morning" ? "朝" : daily.slot === "noon" ? "昼" : "夜";
  }, [daily?.slot]);

  // 表示名とID
  const displayName = FALLBACK_USER.name;
  const displayIdNoStr = FALLBACK_USER.idNoStr;

  const goDaily = () => router.push("/daily");

  if (loading) return <div className="p-6 text-white/70">読み込み中…</div>;
  if (err) return <div className="p-6 text-red-400">エラー：{err}</div>;

  return (
    <div className="min-h-[100svh] bg-gradient-to-b from-[#0B0E19] to-black text-white">
      <main className="mx-auto w-full max-w-3xl px-5 py-8 space-y-6">
        {/* 1) ヘッダー（型バッジ＋設定） */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_0_30px_rgba(255,255,255,0.04)]">
          <div className="flex items-center justify-between">
            <span
              className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
              style={{
                border: `1px solid ${meta.color}`,
                color: meta.color,
                backgroundColor: `${meta.color}26`,
                boxShadow: `0 0 0.25rem ${meta.color}66`,
              }}
            >
              {meta.label}
            </span>
            <button
              className="text-sm text-white/70 hover:text-white transition-opacity"
              onClick={() => router.push("/settings")}
            >
              設定
            </button>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <Image
              src={FALLBACK_USER.avatar}
              alt="Profile Icon"
              width={56}
              height={56}
              className="h-14 w-14 rounded-full border border-white/20 bg-black/20"
            />
            <div className="min-w-0">
              <div className="text-xl font-semibold truncate">{displayName}</div>
              <div className="text-sm text-white/70">ID: {displayIdNoStr}</div>
              {/* テーマチップ */}
              <div className="mt-2">
                <span
                  className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                  style={{
                    border: `1px solid ${themeColor}`,
                    color: themeColor,
                    backgroundColor: `${themeColor}26`,
                    boxShadow: `0 0 0.25rem ${themeColor}66`,
                  }}
                >
                  {themeKey ? themeKey.toUpperCase() : "—"}
                </span>
                <span className="ml-2 text-xs text-white/50">{fmt(daily?.created_at)}</span>
              </div>
            </div>
          </div>
        </section>

        {/* 2) 直近メッセージ（コメント／アドバイス／アファ） */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.06] p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">直近のメッセージ</h3>
            <span className="text-xs text-white/50">
              {slotJp !== "-" ? `スロット：${slotJp}` : ""}
              {daily?.score != null ? `（スコア：${daily.score}）` : ""}
            </span>
          </div>

          <div className="mt-3 space-y-4">
            <div>
              <div className="text-[11px] uppercase tracking-widest text-white/60 mb-1">コメント</div>
              <p className="leading-relaxed tracking-[0.01em]">{daily?.comment ?? "-"}</p>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-widest text-white/60 mb-1">アドバイス</div>
              <p className="leading-relaxed tracking-[0.01em]">{daily?.advice ?? "-"}</p>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-widest text-white/60 mb-1">アファメーション</div>
              <p className="leading-relaxed tracking-[0.01em] font-medium">{daily?.affirm ?? "-"}</p>
            </div>
          </div>
        </section>

        {/* 3) 構造バランス（Chartsがあれば表示） */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.05] p-6">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-base font-semibold">構造バランス</h3>
            <span className="text-xs text-white/50">Radar / Line（横スワイプ or 切替）</span>
          </div>

          {charts ? (
            <div className="flex flex-col gap-6">
              {/* Radar */}
              <div className="w-full grid place-items-center">
                <charts.RadarChart values={today?.scores ?? today ?? { E: 0.25, V: 0.25, L: 0.25, Eexists: 0.25 }} size={280} />
              </div>

              {/* Line */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-sm text-white/80">Line（{range}日推移）</div>
                  <div className="flex gap-2 text-xs">
                    {[7, 30, 90].map((n) => (
                      <button
                        key={n}
                        onClick={() => setRange(n as 7 | 30 | 90)}
                        className={`px-3 py-1 rounded border transition ${
                          range === n ? "bg-white/15 border-white/30" : "bg-white/5 border-white/10 hover:bg-white/10"
                        }`}
                      >
                        {n}日
                      </button>
                    ))}
                  </div>
                </div>
                <div className="w-full">
                  <charts.TimeSeriesChart data={Array.isArray(series) ? series : []} />
                </div>
              </div>
            </div>
          ) : (
            <div className="h-56 grid place-items-center text-white/60">
              チャートモジュール未導入のため、近日表示予定
            </div>
          )}
        </section>

        {/* 4) 次の一歩 */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <div className="text-base font-semibold">次の一歩を選んでください</div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              onClick={goDaily}
              className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-3 text-white font-medium hover:opacity-95 shadow-[0_0_24px_rgba(99,102,241,0.35)]"
            >
              デイリー診断
              <div className="text-xs text-white/80">1問 / 今日のゆらぎ</div>
            </button>
            <button
              disabled
              className="rounded-xl bg-white/10 px-4 py-3 text-white/60 font-medium border border-white/10 cursor-not-allowed"
              title="近日公開"
            >
              診断タイプを選ぶ
              <div className="text-xs">Weekly / Monthly（予定）</div>
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
