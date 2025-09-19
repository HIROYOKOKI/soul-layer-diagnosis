// app/mypage/MyPageClient.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

// Charts を使う前提（未導入なら RadarChart / TimeSeriesChart 部分をコメントアウト）
import {
  RadarChart,
  TimeSeriesChart,
  type EVAEVector,
  type SeriesPoint,
} from "@/components/charts/Charts";

/* =========================
   Types
========================= */
type EV = "E" | "V" | "Λ" | "Ǝ";
type Scope = "WORK" | "LOVE" | "FUTURE" | "LIFE";

type ProfileLatest = {
  fortune?: string | null;
  personality?: string | null;
  partner?: string | null;
  created_at?: string | null;
  base_model?: "EΛVƎ" | "EVΛƎ" | null;
  base_order?: EV[] | null;
} | null;

type DailyLatest = {
  code?: EV | null;
  comment?: string | null;
  quote?: string | null;
  theme?: string | null;               // 互換用（旧実装）
  env?: "dev" | "prod" | null;
  created_at?: string | null;
  updated_at?: string | null;
} | null;

type ThemeLatest = { theme: EV; env: "dev" | "prod"; created_at: string } | null; // EVΛƎ テーマ（履歴の最新1件）
type ThemeAPI = { ok: boolean; scope?: Scope; item?: ThemeLatest } | null;

type EVAEVectorLocal = EVAEVector;
type SeriesPointLocal = SeriesPoint;

type Me = {
  ok: boolean;
  id: string;             // UUID
  idNo: number | null;    // 連番
  idNoStr: string | null; // "0001" 形式
} | null;

type QuickLatest = {
  type_key?: "EVΛƎ" | "EΛVƎ" | null;
  type_label?: string | null;
  comment?: string | null;
  advice?: string | null;
  created_at?: string | null;
} | null;

/* =========================
   Utils
========================= */
const FALLBACK_USER = { name: "Hiro", idNoStr: "0001", avatar: "/icon-512.png" };

const clamp01 = (v: unknown) => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0;
};

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

function normalizeToday(v: any): EVAEVectorLocal {
  const L = typeof v?.L === "number" ? v.L : typeof v?.["Λ"] === "number" ? v["Λ"] : 0;
  return { E: clamp01(v?.E), V: clamp01(v?.V), L: clamp01(L), Eexists: clamp01(v?.Eexists ?? v?.["Ǝ"]) };
}
function normalizeSeries(list: any[]): SeriesPointLocal[] {
  return (list ?? []).map((d) => {
    const L = typeof d?.L === "number" ? d.L : typeof d?.["Λ"] === "number" ? d["Λ"] : 0;
    return {
      date: String(d?.date ?? "").slice(0, 10),
      E: clamp01(d?.E),
      V: clamp01(d?.V),
      L: clamp01(L),
      Eexists: clamp01(d?.Eexists ?? d?.["Ǝ"]),
    };
  });
}
function normalizeModel(s?: string | null): "EΛVƎ" | "EVΛƎ" | null {
  if (!s) return null;
  const t = String(s).replace(/\s+/g, "");
  if (t.includes("EΛVƎ")) return "EΛVƎ";
  if (t.includes("EVΛƎ")) return "EVΛƎ";
  return null;
}
function decideModelFromCode(code?: string | null): "EΛVƎ" | "EVΛƎ" | null {
  const c = (code || "").trim();
  if (!c) return null;
  return c === "E" || c === "Λ" ? "EΛVƎ" : c === "V" || c === "Ǝ" ? "EVΛƎ" : null;
}
function decideModelFromOrder(order?: EV[] | null): "EΛVƎ" | "EVΛƎ" | null {
  if (!order?.length) return null;
  const top = order[0];
  return top === "E" || top === "Λ" ? "EΛVƎ" : top === "V" || top === "Ǝ" ? "EVΛƎ" : null;
}
function modelMeta(model: "EΛVƎ" | "EVΛƎ" | null) {
  if (model === "EΛVƎ") return { color: "#B833F5", label: "現実思考型（EΛVƎ）" }; // 紫（確定）
  if (model === "EVΛƎ") return { color: "#FF4500", label: "未来志向型（EVΛƎ）" }; // オレンジ（確定）
  return { color: "#888888", label: "" };
}
const hexToRgba = (hex: string, alpha = 0.15) => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return `rgba(255,255,255,${alpha})`;
  const [r, g, b] = [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/* =========================
   Component
========================= */
export default function MyPageClient() {
  const router = useRouter();
  const search = useSearchParams();

  // env（dev/prod）
  const [env, setEnv] = useState<"dev" | "prod">("prod");

  // data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [me, setMe] = useState<Me>(null);                    // /api/me
  const [profile, setProfile] = useState<ProfileLatest>(null);
  const [daily, setDaily] = useState<DailyLatest>(null);
  const [theme, setTheme] = useState<ThemeLatest>(null);      // EVΛƎ テーマ（履歴）
  const [scope, setScope] = useState<Scope>("LIFE");          // ★ 追加：デイリーテーマ（WORK/LOVE/FUTURE/LIFE）
  const [quick, setQuick] = useState<QuickLatest>(null);

  // charts
  const [range, setRange] = useState<7 | 30 | 90>(30);
  const [today, setToday] = useState<EVAEVectorLocal | null>(null);
  const [series, setSeries] = useState<SeriesPointLocal[] | null>(null);
  const [chartsErr, setChartsErr] = useState<string | null>(null);

  // env 初期化（localStorage）
  useEffect(() => {
    try {
      const saved = localStorage.getItem("ev-env");
      if (saved === "dev" || saved === "prod") setEnv(saved);
      else localStorage.setItem("ev-env", "prod");
    } catch {}
  }, []);

  // URL ?env=dev|prod で上書き
  useEffect(() => {
    const p = search?.get("env");
    if (p === "dev" || p === "prod") {
      setEnv(p);
      try {
        localStorage.setItem("ev-env", p);
      } catch {}
    }
  }, [search]);

  // /api/me を 1 回だけ取得（表示用ID）
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/me", { cache: "no-store" });
        const j = await r.json();
        if (!alive) return;
        if (j?.ok) setMe(j);
      } catch {
        /* noop: FALLBACK を使う */
      }
    })();
    return () => { alive = false; };
  }, []);

  // 最新データ（テーマ / プロフィール / デイリー / Quick）
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const qs = `?env=${encodeURIComponent(env)}`;

        const [pRes, dRes, tRes, qRes] = await Promise.all([
          fetch("/api/mypage/profile-latest", { cache: "no-store" }),
          fetch(`/api/mypage/daily-latest${qs}`, { cache: "no-store" }),
          fetch(`/api/theme${qs}`, { cache: "no-store" }),        // ★ scope を含む
          fetch("/api/mypage/quick-latest", { cache: "no-store" }),
        ]);

        const [p, d, t, q]: [any, any, ThemeAPI, any] =
          await Promise.all([pRes.json(), dRes.json(), tRes.json(), qRes.json()]);

        // daily は env 片方に無い場合フォールバック（dev⇄prod）
        let dailyJson = d;
        if (!dailyJson?.item) {
          const other = env === "prod" ? "dev" : "prod";
          try {
            const dOther = await fetch(`/api/mypage/daily-latest?env=${other}`, { cache: "no-store" }).then((r) => r.json());
            if (dOther?.ok && dOther?.item) {
              dailyJson = dOther;
              setEnv(other);
              try { localStorage.setItem("ev-env", other); } catch {}
            }
          } catch {}
        }

        if (!alive) return;
        if (!p?.ok) throw new Error(p?.error || "profile_latest_failed");
        if (!dailyJson?.ok) throw new Error(dailyJson?.error || "daily_latest_failed");

        setProfile(p.item ?? null);
        setDaily(dailyJson.item ?? null);

        // ★ /api/theme の新仕様に対応
        if (t?.ok) {
          if (t.scope) setScope(t.scope);
          setTheme(t.item ?? null); // EVΛƎ テーマ（ユーザーが選んだ履歴の最新1件）
        } else {
          setTheme(null);
        }

        setQuick(q?.ok ? (q.item ?? null) : null);
      } catch (e: any) {
        if (alive) setError(e?.message || "fetch_failed");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [env]);

  // チャート
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setChartsErr(null);
        const [tRes, sRes] = await Promise.all([
          fetch("/api/today", { cache: "no-store" }),
          fetch(`/api/series?days=${range}`, { cache: "no-store" }),
        ]);
        if (!tRes.ok) throw new Error("/api/today failed");
        if (!sRes.ok) throw new Error("/api/series failed");

        const tJson = await tRes.json();
        const sJson = await sRes.json();
        if (!alive) return;
        setToday(tJson?.scores ? normalizeToday(tJson.scores) : normalizeToday(tJson));
        setSeries(normalizeSeries(sJson));
      } catch (e: any) {
        if (!alive) return;
        setChartsErr(e?.message ?? "charts fetch error");
      }
    })();
    return () => { alive = false; };
  }, [range]);

  // 型推定：base_model → daily.code → base_order(top)
  const normalizedModel =
    normalizeModel(profile?.base_model ?? null) ||
    decideModelFromCode(daily?.code ?? null) ||
    decideModelFromOrder(profile?.base_order ?? null);
  const meta = modelMeta(normalizedModel);

  const goDaily = () => router.push(`/daily/question?scope=${encodeURIComponent(scope)}`);
  const goTheme = () => router.push("/theme");
  const goSettings = () => router.push("/settings");

  const fadeUp = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 } };

  if (loading) return <div className="p-6 text-white/70">読み込み中…</div>;
  if (error) return <div className="p-6 text-red-400">エラー: {String(error)}</div>;

  // 表示名とID（なければフォールバック）
  const displayName = FALLBACK_USER.name; // name は現状 API 未返却のため固定
  const displayIdNoStr = me?.idNoStr || FALLBACK_USER.idNoStr;

  // Quick カラー（確定値）
  const quickColor = quick?.type_key === "EVΛƎ" ? "#FF4500" : quick?.type_key === "EΛVƎ" ? "#B833F5" : "#999999";

  return (
    <div className="min-h-[100svh] bg-black text-white">
      <main className="mx-auto w-full max-w-3xl px-5 py-8 space-y-6">
        {/* 1) ヘッダー（型バッジ＋プロフィール） */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <div className="flex items-center justify-between">
            {meta.label ? (
              <span
                className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
                style={{
                  border: `1px solid ${meta.color}`,
                  color: meta.color,
                  backgroundColor: hexToRgba(meta.color, 0.12),
                  boxShadow: `0 0 0.25rem ${hexToRgba(meta.color, 0.4)}`,
                }}
              >
                {meta.label}
              </span>
            ) : (
              <span className="text-xs text-white/50">タイプ未推定</span>
            )}
            <button onClick={goSettings} className="text-sm text-white/70 hover:text-white">
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
            <div>
              <div className="text-xl font-semibold">{displayName}</div>
              <div className="text-sm text-white/70">ID: {displayIdNoStr}</div>
            </div>
          </div>
        </section>

        {/* 2) テーマカード（scope と EVΛƎ テーマの最新） */}
        <AnimatePresence>
          <motion.section
            key="theme"
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
            {...fadeUp}
            transition={{ duration: 0.22 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-white/70">
                  選択中のテーマ（{theme?.env ?? daily?.env ?? env}）
                </div>
            <div className="text-lg font-medium">
  現在のテーマ: {scope}
</div>


                {/* 参考: EVΛƎ テーマ（履歴の最新1件） */}
                {theme?.theme ? (
                  <div className="mt-1 text-xs text-white/60">
                    EVΛƎテーマ: {theme.theme} / {fmt(theme.created_at)}
                  </div>
                ) : (
                  <div className="text-xs text-white/50">EVΛƎテーマ: —</div>
                )}
              </div>

              <button
                onClick={goTheme}
                className="rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-sm hover:bg-white/15"
              >
                変更する
              </button>
            </div>
          </motion.section>
        </AnimatePresence>

        {/* 3) 直近メッセージ */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.06] p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">直近のメッセージ</h3>
            <span className="text-xs text-white/50">
              {fmt(daily?.updated_at || daily?.created_at || profile?.created_at)}
            </span>
          </div>
          <p className="mt-3 leading-relaxed">
            {daily?.comment || daily?.quote || profile?.fortune || "まだメッセージはありません。"}
          </p>
          {daily?.quote ? (
            <blockquote className="mt-3 italic text-white/90">“{daily.quote}”</blockquote>
          ) : null}
        </section>

        {/* 3.5) Quick 診断（最新） */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-base font-semibold">Quick 診断（最新）</h3>
            <span className="text-xs text-white/50">{quick?.created_at ? fmt(quick.created_at) : "—"}</span>
          </div>

          {quick ? (
            <div
              className="rounded-xl p-4 ring-1 border border-white/10 bg-white/[0.04]"
              style={{
                borderColor: hexToRgba(quickColor, 0.35),
                boxShadow: `0 0 14px ${hexToRgba(quickColor, 0.28)}`,
              }}
            >
              <div className="text-sm font-bold" style={{ color: quickColor }}>
                {quick.type_label}
              </div>
              {quick.comment && <p className="mt-2 text-white/80">{quick.comment}</p>}
              {quick.advice && (
                <p className="mt-1 font-semibold" style={{ color: quickColor }}>
                  {quick.advice}
                </p>
              )}
            </div>
          ) : (
            <p className="text-white/60">まだQuick診断がありません。</p>
          )}
        </section>

        {/* 4) 構造バランス（Radar / Line） */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-base font-semibold">構造バランス</h3>
            <span className="text-xs text-white/50">Radar / Line（横スワイプ）</span>
          </div>

          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2">
            <div className="min-w-full snap-center flex justify-center">
              <div className="w-full max-w-xs">
                {today ? (
                  <RadarChart values={today} size={260} />
                ) : (
                  <div className="text-xs text-white/50">No Data</div>
                )}
              </div>
            </div>

            <div className="min-w-full snap-center">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm text-white/80">Line（{range}日推移）</div>
                <div className="flex gap-2 text-xs">
                  {[7, 30, 90].map((n) => (
                    <button
                      key={n}
                      onClick={() => setRange(n as 7 | 30 | 90)}
                      className={`px-3 py-1 rounded border ${
                        range === n ? "bg-white/15 border-white/30" : "bg-white/5 border-white/10 hover:bg-white/10"
                      }`}
                    >
                      {n}日
                    </button>
                  ))}
                </div>
              </div>
              {series ? (
                <TimeSeriesChart data={series} />
              ) : (
                <div className="h-56 grid place-items-center text-white/60">読み込み中…</div>
              )}
              {chartsErr && <div className="mt-2 text-xs text-red-300">[{chartsErr}] フォールバック表示中</div>}
            </div>
          </div>
        </section>

        {/* 5) 次の一歩 */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="text-base font-semibold">次の一歩を選んでください</div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              onClick={goDaily}
              className="rounded-xl bg-white px-4 py-3 text-black font-medium hover:opacity-90"
            >
              デイリー診断
              <div className="text-xs text-black/70">1問 / 今日のゆらぎ</div>
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
