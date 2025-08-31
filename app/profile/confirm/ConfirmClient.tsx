// app/profile/confirm/ConfirmClient.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

// ---- Local GlowButton（エイリアス不要・依存なし）----
function GlowButton({
  children,
  variant = "primary",
  className = "",
  fullWidth = false,
  disabled,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost"
  fullWidth?: boolean
}) {
  const base =
    "rounded-full transition font-extrabold tracking-wide uppercase h-12 " +
    (fullWidth ? "w-full " : "w-auto ")
  const style =
    variant === "primary"
      ? "px-8 bg-gradient-to-r from-sky-500 to-indigo-500 text-white " +
        "shadow-[0_0_18px_rgba(56,189,248,.45)] hover:shadow-[0_0_28px_rgba(56,189,248,.75)] " +
        "active:translate-y-[1px] disabled:opacity-60"
      : "px-6 bg-black text-white border border-white/20 hover:bg-white hover:text-black " +
        "active:translate-y-[1px]"
  return (
    <button disabled={disabled} className={`${base}${style} ${className}`} {...props}>
      {children}
    </button>
  )
}

// ---- Types / API ----
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
    } finally { setLoading(false) }
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

      {/* ヘッダー：左テキスト / 右アイコン（safe-area上マージン） */}
      <header className="px-5 pt-[calc(env(safe-area-inset-top)+16px)] pb-4 max-w-6xl mx-auto flex items-center justify-between">
        <span className="text-[15px] md:text-base tracking-[0.18em] font-semibold">
          SOUL LAYER DIAGNOSIS
        </span>
        <span
          className="h-10 w-10 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 ring-1 ring-sky-300/50 shadow-[0_0_28px_rgba(56,189,248,.75)] shrink-0"
          aria-hidden
        />
      </header>

      {/* 本文コンテナ（幅を締め、呼吸する余白） */}
      <div className="mx-auto w-full max-w-[680px] px-5 sm:px-6 pb-[calc(env(safe-area-inset-bottom)+24px)]">
        <h1 className="mt-1 text-[22px] sm:text-2xl font-bold tracking-wide">入力内容の確認</h1>
        <p className="text-sm opacity-75 mt-1">送信前にもう一度ご確認ください。</p>

        {/* カード */}
        <section className="mt-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-6 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,.45)]">
          <dl className="grid gap-3 sm:gap-3.5 text-[15px] leading-[1.9]">
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

        {/* CTA：常時横並び（狭幅は折り返し） */}
        <div className="mt-8 flex flex-row justify-center items-center gap-4 flex-wrap">
          <GlowButton
            variant="ghost"
            className="min-w-[160px]"
            onClick={() => router.push("/profile")}
          >
            修正する
          </GlowButton>

          <GlowButton
            variant="primary"
            className="min-w-[200px]"
            disabled={loading}
            onClick={handleConfirm}
          >
            {loading ? "診断中…" : "この内容で診断"}
          </GlowButton>
        </div>

        <footer className="mt-10 sm:mt-12 pb-4 text-[11px] opacity-70 text-center">
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
