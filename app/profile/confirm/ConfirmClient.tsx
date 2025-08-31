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

  // 入力一時保存を読み込み。無ければ入力画面へ
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

      // 2) 結果をセッションへ保存（結果ページで使用）
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
      {/* 背景：黒＋淡いオーラ＋水平ライン（他ページと統一） */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-black" />
        <div className="absolute inset-0 bg-[radial-gradient(600px_420px_at_50%_15%,rgba(79,195,255,0.18),transparent)]" />
        <div className="absolute inset-x-0 top-[44%] h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      </div>

      <div className="mx-auto max-w-5xl px-5 py-10">
        {/* タイトル */}
        <header className="mb-6">
          <h1 className="text-2xl font-bold tracking-wide">入力内容の確認</h1>
          <p className="text-sm opacity-70 mt-1">送信前にもう一度ご確認ください。</p>
        </header>

        {/* ガラスカード */}
        <section className="max-w-2xl rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 shadow-[0_10px_40px_rgba(0,0,0,.35)]">
          <dl className="grid gap-3 text-[15px] leading-relaxed">
            <Item label="名前"        value={p.name} />
            <Item label="誕生日"      value={p.birthday} />
            <Item label="血液型"      value={p.blood} />
            <Item label="性別"        value={p.gender} />
            {p.preference ? <Item label="恋愛対象" value={p.preference} /> : null}
          </dl>

          {/* CTA */}
        <div className="mt-6 flex flex-wrap gap-10">
  {/* 修正するボタン：黒ベース → hoverで反転 */}
  <button
    onClick={() => router.push("/profile")}
    className="h-11 px-6 rounded-full bg-black text-white
               border border-white/20
               hover:bg-white hover:text-black
               transition font-medium"
  >
    修正する
  </button>

  {/* Glow診断ボタン：未来的な光 */}
  <button
    onClick={handleConfirm}
    disabled={loading}
    className="relative h-11 px-8 rounded-full font-semibold uppercase tracking-wide
               bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500
               text-white shadow-[0_0_20px_rgba(168,85,247,0.6)]
               hover:shadow-[0_0_30px_rgba(168,85,247,0.9)]
               transition disabled:opacity-60"
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

/* 小物：行表示 */
function Item({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-4">
      <dt className="opacity-70">{label}</dt>
      <dd className="opacity-95">{value || "—"}</dd>
    </div>
  )
}
