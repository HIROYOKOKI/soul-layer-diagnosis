// app/mypage/MyPageClient.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

/* =========================
   Types（最小）
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
  theme?: string | null; // DBは小文字（work/love/future/life）想定
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

/* =========================
   Component
========================= */
export default function MyPageClient() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [profile, setProfile] = useState<ProfileLatest>(null);
  const [daily, setDaily] = useState<DailyLatest>(null);

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
    return () => {
      alive = false;
    };
  }, []);

  const model =
    (profile?.base_model as "EΛVƎ" | "EVΛƎ" | null) ?? null;
  const meta = modelMeta(model);

  const goDaily = () => router.push("/daily");

  if (loading) return <div className="p-6 text-white/70">読み込み中…</div>;
  if (err) return <div className="p-6 text-red-400">エラー：{err}</div>;

  const displayName = FALLBACK_USER.name;
  const displayIdNoStr = FALLBACK_USER.idNoStr;
  const themeLabel = daily?.theme ? daily.theme.toUpperCase() : "-";
  const slotJp =
    daily?.slot === "morning" ? "朝" : daily?.slot === "noon" ? "昼" : daily?.slot === "night" ? "夜" : "-";

  return (
    <div className="min-h-[100svh] bg-black text-white">
      <main className="mx-auto w-full max-w-3xl px-5 py-8 space-y-6">
        {/* 1) ヘッダー（型バッジ＋プロフィール） */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <div className="flex items-center justify-between">
            <span
              className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
              style={{
                border: `1px solid ${meta.color}`,
                color: meta.color,
                backgroundColor: `${meta.color}26`, // ~15% alpha
                boxShadow: `0 0 0.25rem ${meta.color}66`,
              }}
            >
              {meta.label}
            </span>
            <button className="text-sm text-white/70 hover:text-white" onClick={() => router.push("/settings")}>
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

        {/* 2) 最新デイリー */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.06] p-5">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-base font-semibold">最新デイリー</h3>
            <span className="text-xs text-white/50">{fmt(daily?.created_at)}</span>
          </div>

          {daily ? (
            <div className="space-y-3">
              <div className="text-sm text-white/70">
                スロット：{slotJp} ／ テーマ：{themeLabel} ／ スコア：{daily?.score ?? "-"}
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider opacity-60 mb-1">コメント</div>
                <p>{daily?.comment ?? "-"}</p>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider opacity-60 mb-1">アドバイス</div>
                <p>{daily?.advice ?? "-"}</p>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider opacity-60 mb-1">アファメーション</div>
                <p className="font-medium">{daily?.affirm ?? "-"}</p>
              </div>
            </div>
          ) : (
            <p className="text-white/70">まだデイリー結果がありません。</p>
          )}

          <div className="mt-4">
            <button
              onClick={goDaily}
              className="rounded-xl bg-white px-4 py-3 text-black font-medium hover:opacity-90"
            >
              デイリー診断へ
            </button>
          </div>
        </section>

        {/* 3) 最新プロフィール */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-base font-semibold">最新プロフィール</h3>
            <span className="text-xs text-white/50">{fmt(profile?.created_at)}</span>
          </div>

          {profile ? (
            <div className="space-y-3">
              <div className="text-sm text-white/70">
                モデル：{profile?.base_model ?? "-"} ／ 並び：{profile?.base_order?.join("・") ?? "-"}
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider opacity-60 mb-1">運勢</div>
                <p>{profile?.fortune ?? "-"}</p>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider opacity-60 mb-1">性格</div>
                <p>{profile?.personality ?? "-"}</p>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider opacity-60 mb-1">パートナー</div>
                <p>{profile?.partner ?? "-"}</p>
              </div>
            </div>
          ) : (
            <p className="text-white/70">プロフィール診断がまだありません。</p>
          )}
        </section>

        {/* 予備：将来のチャート領域 */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-white/60">
          将来：レーダー／時系列チャートをここに表示（Charts導入後に復活）
        </section>
      </main>
    </div>
  );
}
