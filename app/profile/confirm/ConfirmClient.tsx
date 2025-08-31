// app/profile/confirm/ConfirmClient.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export type ProfilePayload = {
  name: string
  birthday: string // YYYY-MM-DD
  blood: string
  gender: string
  preference?: string | null
  theme?: string | null
}

async function diagnoseProfile(payload: ProfilePayload): Promise<{ luneaLines: string[] }> {
  const res = await fetch("/api/profile/diagnose", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ theme: payload.theme ?? "dev", ...payload }),
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`HTTP_${res.status}`)
  const json = await res.json()
  const lines = json?.result?.luneaLines
  if (!json?.ok || !Array.isArray(lines)) throw new Error(json?.error || "profile_diagnose_failed")
  return { luneaLines: lines as string[] }
}

type Pending = ProfilePayload

export default function ConfirmClient() {
  const router = useRouter()

  const [p, setP] = useState<Pending | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

      const res = await diagnoseProfile(p)
      sessionStorage.removeItem("profile_pending")
      sessionStorage.setItem("profile_result_luneaLines", JSON.stringify(res.luneaLines))

      try {
        const save = await fetch("/api/profile/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ luneaLines: res.luneaLines, theme: "dev" }),
          cache: "no-store",
        })
        if (!save.ok) setError(`save_failed_${save.status}`)
      } catch { setError("save_failed_network") }

      router.push("/profile/result")
    } catch (e:any) {
      setError(e?.message || "diagnose_failed")
    } finally {
      setLoading(false)
    }
  }

  if (!p) return null

  return (
    <main className="min-h-[100dvh] relative text-white">
      {/* 背景 */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-black" />
        <div className="absolute inset-0 bg-[radial-gradient(640px_440px_at_50%_14%,rgba(56,189,248,0.18),transparent)]" />
        <div className="absolute inset-x-0 top-[44%] h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      </div>

      {/* ヘッダー：テキストのみ */}
      <header className="flex items-center justify-center px-5 py-6 max-w-6xl mx-auto">
        <span className="text-[15px] md:text-base tracking-[0.18em] font-semibold">
          SOUL LAYER DIAGNOSIS
        </span>
      </header>

      {/* 本文 */}
      <div className="mx-auto max-w-5xl px-5">
        <h1 className="text-2xl font-bold tracking-wide">入力内容の確認</h1>
        <p className="text-sm opacity-70 mt-1">送信前にもう一度ご確認ください。</p>

        {/* 情報カード */}
        <section className="mt-6 max-w-2xl rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 shadow-[0_10px_40px_rgba(0,0,0,.35)]">
          <dl className="grid gap-3 text-[15px] leading-relaxed">
            <Item label="名前"     value={p.name} />
            <Item label="誕生日"   value={p.birthday} />
            <Item label="血液型"   value={p.blood} />
            <Item label="性別"     value={p.gender} />
            {p.preference ? <Item label="恋愛対象" value={p.preference} /> : null}
          </dl>

          {error && (
            <p className="mt-4 text-sm text-rose-300">エラー：{error}（時間をおいて再試行してください）</p>
          )}
        </section>

        {/* カード外：横並びボタン */}
        <div className="mt-8 flex flex-wrap items-center gap-6">
          {/* 修正する：常時黒、hoverで背景と文字色反転 */}
          <button
            onClick={() => router.push("/profile")}
            className="h-12 px-8 rounded-full bg-black text-white border border-white/20 hover:bg-white hover:text-black transition font-medium"
          >
            修正する
          </button>

          {/* この内容で診断：Glow Primary */}
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={[
              "btn-primary",
              "h-12 px-10 rounded-full font-extrabold tracking-wide uppercase",
              "bg-gradient-to-r from-sky-500 to-indigo-500",
              "text-white shadow-[0_0_22px_rgba(79,70,229,.55)]",
              "hover:shadow-[0_0_30px_rgba(79,70,229,.85)]",
              "transition disabled:opacity-60"
            ].join(" ")}
          >
            {loading ? "診断中…" : "この内容で診断"}
          </button>
        </div>

        {/* フッター：中央配置 */}
        <footer className="mt-12 pb-10 text-[11px] opacity-70 text-center">
          © 2025 EVΛƎ PROJECT
        </footer>
      </div>
    </main>
  )
}

function Item({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-4">
      <dt className="opacity-70">{label}</dt>
      <dd className="opacity-95">{value || "—"}</dd>
    </div>
  )
}

/*
Manual test cases:
1) /profile で入力→確認→「この内容で診断」→ /profile/result へ遷移し、保存が反映される。
2) /profile/confirm を直叩き→ /profile にリダイレクトされる。
3) /api/profile/diagnose を強制500にするとエラー文言が表示される。
4) /api/profile/save が404でも遷移は続行、画面下にエラー文言が出る。
*/
