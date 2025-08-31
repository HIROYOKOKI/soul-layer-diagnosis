// app/profile/confirm/ConfirmClient.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useProfileDiagnose, type ProfilePayload } from "../_hooks/useProfileDiagnose"

type Pending = ProfilePayload

export default function ConfirmClient() {
  const router = useRouter()
  const diagnose = useProfileDiagnose()

  const [p, setP] = useState<Pending | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 一時保存の入力を復元。無ければ入力ページへ戻す
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("profile_pending")
      if (!raw) { router.replace("/profile"); return }
      setP(JSON.parse(raw) as Pending)
    } catch { router.replace("/profile") }
  }, [router])

  async function handleConfirm() {
    if (!p) return
    try {
      setLoading(true); setError(null)

      // 1) 診断（フック経由）
      const res = await diagnose(p) // { luneaLines: string[] }

      // 2) 結果をセッションへ（結果ページで使用）
      sessionStorage.removeItem("profile_pending")
      sessionStorage.setItem("profile_result_luneaLines", JSON.stringify(res.luneaLines))

      // 3) 保存API（任意：失敗しても遷移は続行）
      try {
        const save = await fetch("/api/profile/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ luneaLines: res.luneaLines, theme: "dev" }),
          cache: "no-store",
        })
        if (!save.ok) setError(`save_failed_${save.status}`)
      } catch { setError("save_failed_network") }

      // 4) 結果へ
      router.push("/profile/result")
    } catch (e: any) {
      setError(e?.message || "diagnose_failed")
    } finally {
      setLoading(false)
    }
  }

  if (!p) return null

  return (
    <main className="min-h-[100dvh] relative text-white">
      {/* 背景（黒ベース＋淡いオーラ） */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-black" />
        <div className="absolute inset-0 bg-[radial-gradient(600px_420px_at_50%_15%,rgba(79,195,255,0.18),transparent)]" />
        <div className="absolute inset-x-0 top-[44%] h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      </div>

      {/* ヘッダー：ロゴ + EVΛƎ PROJECT */}
      <header className="flex items-center justify-between px-5 py-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-3">
          <img src="/soul-layer-diagnosis.png" alt="Soul Layer" className="h-8 w-auto" />
          <span className="text-lg font-bold tracking-wide">EVΛƎ PROJECT</span>
        </div>
      </header>

      {/* 本文 */}
      <div className="mx-auto max-w-5xl px-5 pb-16">
        <h1 className="text-2xl font-bold tracking-wide">入力内容の確認</h1>
        <p className="text-sm opacity-70 mt-1">送信前にもう一度ご確認ください。</p>

        {/* ガラスカード */}
        <section className="mt-6 max-w-2xl rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 shadow-[0_10px_40px_rgba(0,0,0,.35)]">
          <dl className="grid gap-3 text-[15px] leading-relaxed">
            <Item label="名前" value={p.name} />
            <Item label="誕生日" value={p.birthday} />
            <Item label="血液型" value={p.blood} />
            <Item label="性別" value={p.gender} />
            {p.preference ? <Item label="恋愛対象" value={p.preference} /> : null}
          </dl>

          {/* ボタン：横並び */}
          <div className="mt-7 flex flex-wrap gap-8">
            {/* 修正する：常時黒、hoverで反転（A案） */}
            <button
              onClick={() => router.push("/profile")}
              className="h-11 px-6 rounded-full bg-black text-white
                         border border-white/20
                         hover:bg-white hover:text-black
                         transition font-medium"
            >
              修正する
            </button>

            {/* 診断ボタン：app/buttons の色を使用（クラス名はプロジェクトの実装に合わせて） */}
            <button
              onClick={handleConfirm}
              disabled={loading}
              className={[
                // ここにプロジェクト共通のボタンクラス名を入れてください（例）
                "btn-primary-glow",
                // フォールバック（共通クラスが無い環境でも光る）
                "relative h-11 px-8 rounded-full font-semibold uppercase tracking-wide",
                "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500",
                "text-white shadow-[0_0_20px_rgba(168,85,247,0.6)] hover:shadow-[0_0_30px_rgba(168,85,247,0.9)]",
                "transition disabled:opacity-60",
              ].join(" ")}
            >
              {loading ? "診断中…" : "この内容で診断"}
            </button>
          </div>

          {error && (
            <p className="mt-4 text-sm text-rose-300">
              エラー：{error}（時間をおいて再試行してください）
            </p>
          )}
        </section>
      </div>
    </main>
  )
}

/* 行表示コンポーネント（ラベル薄／値標準） */
function Item({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-4">
      <dt className="opacity-70">{label}</dt>
      <dd className="opacity-95">{value || "—"}</dd>
    </div>
  )
}
