"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

type EV = "E" | "V" | "Λ" | "Ǝ";
type LatestProfile = { fortune?: string|null; personality?: string|null; partner?: string|null; created_at?: string } | null;
type LatestDaily   = { code?: EV|null; comment?: string|null; quote?: string|null; created_at?: string } | null;
type LatestTheme   = { theme: EV; env: "dev"|"prod"; created_at: string } | null;

export default function MyPageClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<LatestProfile>(null);
  const [daily, setDaily] = useState<LatestDaily>(null);
  const [theme, setTheme] = useState<LatestTheme>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const [p, d, t] = await Promise.all([
          fetch("/api/mypage/profile-latest", { cache: "no-store" }).then(r => r.json()).catch(() => ({ ok:false })),
          fetch("/api/mypage/daily-latest",   { cache: "no-store" }).then(r => r.json()).catch(() => ({ ok:false })),
          fetch("/api/theme?env=dev",         { cache: "no-store" }).then(r => r.json()).catch(() => ({ ok:false })),
        ]);
        setProfile(p?.ok ? p.item ?? null : null);
        setDaily(  d?.ok ? d.item ?? null : null);
        setTheme(  t?.ok ? t.item ?? null : null);
      } catch (e: any) {
        setErr(e?.message ?? "unknown_error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const fadeUp = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
    transition: { duration: 0.25 },
  };

  return (
    <div className="mx-auto max-w-3xl p-4 space-y-4">
      <h1 className="text-2xl font-semibold">マイページ</h1>

      {err && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm">
          読み込みエラー: {err}
        </div>
      )}

      {/* テーマカード */}
      <AnimatePresence>
        <motion.div key="theme" {...fadeUp} className="rounded-2xl ring-1 ring-gray-200 p-4">
          {theme ? (
            <div className="flex w-full items-center justify-between rounded-2xl bg-gray-900 text-white p-4">
              <div>
                <div className="text-sm opacity-80">選択中のテーマ（{theme.env}）</div>
                <div className="text-lg font-medium">{theme.theme}</div>
                <div className="text-xs opacity-70">{new Date(theme.created_at).toLocaleString()}</div>
              </div>
              <button
                className="rounded-xl bg-white/10 px-3 py-1 text-sm hover:bg-white/20 transition"
                onClick={() => router.push("/theme")}
              >
                変更する
              </button>
            </div>
          ) : (
            <div className="flex w-full items-center justify-between rounded-2xl bg-gray-100 p-4">
              <div>
                <div className="text-sm text-gray-600">選択中のテーマ</div>
                <div className="text-lg font-medium text-gray-800">データなし</div>
              </div>
              <button
                className="rounded-xl bg-black text-white px-3 py-1 text-sm"
                onClick={() => router.push("/theme")}
              >
                選ぶ
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* 最新プロフィール診断 */}
      <AnimatePresence>
        <motion.div key="profile" {...fadeUp} className="rounded-2xl ring-1 ring-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-2">最新プロフィール診断</div>
          {profile ? (
            <div className="space-y-1">
              <div className="font-medium">運勢: {profile.fortune ?? "—"}</div>
              <div className="text-sm">性格: {profile.personality ?? "—"}</div>
              <div className="text-sm">理想の相手: {profile.partner ?? "—"}</div>
              {profile.created_at && (
                <div className="text-xs text-gray-500">
                  {new Date(profile.created_at).toLocaleString()}
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-500">データなし</div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* 最新デイリー診断 */}
      <AnimatePresence>
        <motion.div key="daily" {...fadeUp} className="rounded-2xl ring-1 ring-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-2">最新デイリー診断</div>
          {daily ? (
            <div className="space-y-1">
              <div className="font-medium">コード: {daily.code ?? "—"}</div>
              <div className="text-sm whitespace-pre-line">{daily.comment ?? "—"}</div>
              {daily.quote ? <div className="text-xs opacity-75 mt-2">“{daily.quote}”</div> : null}
              {daily.created_at && (
                <div className="text-xs text-gray-500">
                  {new Date(daily.created_at).toLocaleString()}
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-500">データなし</div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* 予備スペース */}
      <div className="rounded-2xl border border-dashed border-gray-300 p-6 text-center text-gray-500">
        将来のレーダーチャート（E/V/Λ/Ǝ）表示スペース
      </div>
    </div>
  );
}
