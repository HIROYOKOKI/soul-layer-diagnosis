// app/profile/result/ResultClient.tsx
"use client"

import React from "react"
import { useRouter } from "next/navigation"
import LuneaBubble from "@/components/LuneaBubble"

type Pending = {
  name: string
  birthday: string
  blood: string
  gender: string
  preference: string | null
}
type DiagnoseResp = { ok: true; result: { name: string; summary: string; luneaLines: string[] } } |
                    { ok: false; error: string }

export default function ResultClient() {
  const router = useRouter()
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [lines, setLines] = React.useState<string[]>([])
  const [idx, setIdx] = React.useState(0)

  React.useEffect(() => {
    async function run() {
      try {
        setError(null); setLoading(true)
        const raw = sessionStorage.getItem("profile_pending")
        if (!raw) { setError("no_profile_pending"); setLoading(false); return }
        const pending = JSON.parse(raw) as Pending
        const resp = await fetch("/api/profile/diagnose", {
          method: "POST",
          headers: { "Content-Type":"application/json" },
          body: JSON.stringify(pending)
        })
        const json = (await resp.json()) as DiagnoseResp
        if (!("ok" in json) || !json.ok) throw new Error((json as any)?.error || "diagnose_failed")
        setLines(json.result.luneaLines || [])
        setIdx(1)
      } catch (e:any) {
        setError(e?.message || "failed")
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

  function next() { setIdx(i => Math.min(lines.length, i + 1)) }
  function restart() { setIdx(1) }
  function backToForm() { router.push("/profile") }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-xl font-bold">診断結果</h1>

      {loading && <div className="text-white/70">生成中…</div>}
      {error && (
        <div className="space-y-3">
          <div className="text-red-300 text-sm">エラー: {error}</div>
          <div className="flex gap-2">
            <button className="px-3 py-2 rounded border border-white/20" onClick={()=>location.reload()}>再試行</button>
            <button className="px-3 py-2 rounded border border-white/20" onClick={backToForm}>入力に戻る</button>
          </div>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="space-y-3">
            {lines.slice(0, idx).map((t, i) => <LuneaBubble key={i} text={t} speed={16} />)}
          </div>

          <div className="flex items-center gap-2 pt-2">
            {idx < lines.length ? (
              <button onClick={next} className="px-4 py-2 rounded-full bg-white/10 border border-white/20 hover:bg-white/15">
                次へ
              </button>
            ) : (
              <button onClick={restart} className="px-4 py-2 rounded-full bg-white/10 border border-white/20 hover:bg-white/15">
                最初から
              </button>
            )}
            <button onClick={backToForm} className="px-4 py-2 rounded-full border border-white/20 hover:bg-white/10">
              入力に戻る
            </button>
          </div>
        </>
      )}
    </div>
  )
}
