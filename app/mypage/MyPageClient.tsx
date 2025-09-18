// app/mypage/MyPageClient.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
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
type ProfileLatest = { fortune?: string|null; personality?: string|null; partner?: string|null; created_at?: string|null; base_model?: "EΛVƎ"|"EVΛƎ"|null; base_order?: EV[]|null; } | null;
type DailyLatest = { code?: EV|null; comment?: string|null; quote?: string|null; theme?: string|null; env?: "dev"|"prod"|null; created_at?: string|null; updated_at?: string|null; } | null;
type ThemeLatest = { theme: EV; env: "dev"|"prod"; created_at: string } | null;
type EVAEVectorLocal = EVAEVector;
type SeriesPointLocal = SeriesPoint;
type Me = { ok:boolean; id:string; idNo:number|null; idNoStr:string|null } | null;

// ★ Quick 最新
type QuickLatest = {
  type_key?: "EVΛƎ" | "EΛVƎ" | null;
  type_label?: string | null;
  comment?: string | null;
  advice?: string | null;
  created_at?: string | null;
} | null;

/* =========================
   Utils（省略部分は元のまま）
========================= */
const FALLBACK_USER = { name: "Hiro", idNoStr: "0001", avatar: "/icon-512.png" };
// clamp01, fmt, normalizeToday, normalizeSeries, normalizeModel, decideModelFromCode, decideModelFromOrder, modelMeta, hexToRgba …はそのまま

/* =========================
   Component
========================= */
export default function MyPageClient() {
  const router = useRouter();
  const search = useSearchParams();

  const [env, setEnv] = useState<"dev"|"prod">("prod");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);

  const [me, setMe] = useState<Me>(null);
  const [profile, setProfile] = useState<ProfileLatest>(null);
  const [daily, setDaily] = useState<DailyLatest>(null);
  const [theme, setTheme] = useState<ThemeLatest>(null);
  const [quick, setQuick] = useState<QuickLatest>(null); // ★追加

  // charts
  const [range, setRange] = useState<7|30|90>(30);
  const [today, setToday] = useState<EVAEVectorLocal|null>(null);
  const [series, setSeries] = useState<SeriesPointLocal[]|null>(null);
  const [chartsErr, setChartsErr] = useState<string|null>(null);

  // …env 初期化, URL env, /api/me fetch, profile/daily/theme fetch, chart fetch は元のまま

  // ★ Quick 最新 fetch
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/mypage/quick-latest", { cache: "no-store" });
        const j = await r.json();
        if (!alive) return;
        if (j?.ok) setQuick(j.item ?? null);
      } catch {}
    })();
    return () => { alive = false };
  }, []);

  // normalizedModel, meta, goDaily, goTheme, goSettings, fadeUp …は元のまま

  if (loading) return <div className="p-6 text-white/70">読み込み中…</div>;
  if (error) return <div className="p-6 text-red-400">エラー: {String(error)}</div>;

  const displayName = FALLBACK_USER.name;
  const displayIdNoStr = me?.idNoStr || FALLBACK_USER.idNoStr;

  return (
    <div className="min-h-[100svh] bg-black text-white">
      <main className="mx-auto w-full max-w-3xl px-5 py-8 space-y-6">
        {/* 1) ヘッダー（型バッジ＋プロフィール） */}
        {/* …元のまま */}

        {/* 2) テーマカード */}
        {/* …元のまま */}

        {/* 3) 直近メッセージ */}
        {/* …元のまま */}

        {/* ★ Quick診断カード */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">Quick診断（最新）</h3>
            <span className="text-xs text-white/50">
              {quick?.created_at ? fmt(quick.created_at) : "—"}
            </span>
          </div>
          {quick ? (
            <div className="mt-3 space-y-2">
              <div
                className={`font-bold ${
                  quick.type_key === "EVΛƎ" ? "text-[#FF4500]" : "text-[#B833F5]"
                }`}
              >
                {quick.type_label}
              </div>
              {quick.comment && (
                <p className="text-white/80 leading-relaxed">{quick.comment}</p>
              )}
              {quick.advice && (
                <p
                  className={`font-semibold ${
                    quick.type_key === "EVΛƎ" ? "text-[#FF4500]" : "text-[#B833F5]"
                  }`}
                >
                  {quick.advice}
                </p>
              )}
            </div>
          ) : (
            <p className="mt-3 text-white/60">まだQuick診断がありません。</p>
          )}
        </section>

        {/* 4) 構造バランス（Radar / Line） */}
        {/* …元のまま */}

        {/* 5) 次の一歩 */}
        {/* …元のまま */}
      </main>
    </div>
  );
}
