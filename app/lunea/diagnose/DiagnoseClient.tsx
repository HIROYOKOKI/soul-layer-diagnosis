// app/lunea/diagnose/DiagnoseClient.tsx
"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"

type ProfilePayload = {
  name: string
  birthday: string
  blood: "A" | "B" | "O" | "AB"
  gender: "Male" | "Female" | "Other"
  preference?: string | null
}
type Ok = { ok: true; result: { luneaLines: string[] } }
type Err = { ok: false; error: string }
type Resp = Ok | Err

export default function DiagnoseClient() {
  const router = useRouter()

  // フォーム（最小）
  const [form, setForm] = useState<ProfilePayload>({
    name: "Hiro",
    birthday: "1985-05-05",
    blood: "A",
    gender: "Male",
    preference: "Unset",
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lines, setLines] = useState<string[] | null>(null)

  // 既に confirm で入力済みなら sessionStorage からデフォルト読取（任意）
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("profile_confirm_form")
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<ProfilePayload>
        setForm(f => ({ ...f, ...parsed }))
      }
    } catch {}
  }, [])

  async function onDiagnose() {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch("/api/profile/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = (await res.json()) as Resp
      if (!json.ok) throw new Error(json.error || "diagnose_failed")

      // 結果をページ内表示 & 既存の /profile/result にも流用できるよう保存
      setLines(json.result.luneaLines)
      sessionStorage.setItem("profile_result_luneaLines", JSON.stringify(json.result.luneaLines))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">ルネア診断（ワンステップ）</h1>

      {/* 入力（最小） */}
      {!lines && (
        <div className="grid gap-3 max-w-md">
          <label className="grid gap-1">
            <span className="text-sm text-gray-600">名前</span>
            <input
              className="px-3 py-2 rounded border border-gray-300 bg-white"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm text-gray-600">誕生日</span>
            <input
              type="date"
              className="px-3 py-2 rounded border border-gray-300 bg-white"
              value={form.birthday}
              onChange={e => setForm({ ...form, birthday: e.target.value })}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1">
              <span className="text-sm text-gray-600">血液型</span>
              <select
                className="px-3 py-2 rounded border border-gray-300 bg-white"
                value={form.blood}
                onChange={e => setForm({ ...form, blood: e.target.value as ProfilePayload["blood"] })}
              >
                {["A","B","O","AB"].map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </label>

            <label className="grid gap-1">
              <span className="text-sm text-gray-600">性別</span>
              <select
                className="px-3 py-2 rounded border border-gray-300 bg-white"
                value={form.gender}
                onChange={e => setForm({ ...form, gender: e.target.value as ProfilePayload["gender"] })}
              >
                {["Male","Female","Other"].map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </label>
          </div>

          <button
            onClick={onDiagnose}
            className="mt-2 px-4 py-2 rounded-2xl bg-black text-white"
            disabled={loading}
          >
            {loading ? "診断中…" : "ルネアに診断してもらう"}
          </button>

          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
      )}

      {/* 結果表示 */}
      {lines && <LuneaTypewriter lines={lines} />}

      {/* 導線 */}
      {lines && (
        <div className="flex gap-3">
          <button onClick={() => setLines(null)} className="px-4 py-2 rounded-2xl bg-neutral-800 text-white">
            もう一度
          </button>
          <button onClick={() => router.push("/profile/result")} className="px-4 py-2 rounded-2xl bg-neutral-900 text-white">
            /profile/result で見る
          </button>
          <button onClick={() => router.push("/mypage")} className="px-4 py-2 rounded-2xl bg-neutral-900 text-white">
            MyPageへ
          </button>
        </div>
      )}
    </div>
  )
}

/** ルネア吹き出し（タイプライター最小実装） */
function LuneaTypewriter({ lines }: { lines: string[] }) {
  const [idx, setIdx] = useState(0)
  const [shown, setShown] = useState("")
  const [typing, setTyping] = useState(true)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    const text = lines[idx] ?? ""
    setShown("")
    setTyping(true)
    let i = 0
    timer.current = window.setInterval(() => {
      i++
      setShown(text.slice(0, i))
      if (i >= text.length) {
        if (timer.current) window.clearInterval(timer.current)
        setTyping(false)
      }
    }, 18)
    return () => { if (timer.current) window.clearInterval(timer.current) }
  }, [idx, lines])

  const next = () => {
    if (typing) {
      if (timer.current) window.clearInterval(timer.current)
      setShown(lines[idx] ?? "")
      setTyping(false)
      return
    }
    if (idx < lines.length - 1) setIdx(idx + 1)
  }

  const restart = () => { setIdx(0); setShown(""); setTyping(true) }
  const isLast = idx >= lines.length - 1

  return (
    <div className="space-y-4">
      <div className="max-w-[680px] rounded-2xl bg-white p-5 shadow leading-relaxed text-[15px]">
        {shown}
      </div>
      <div className="flex gap-3">
        {!isLast ? (
          <button onClick={next} className="px-4 py-2 rounded-2xl bg-black text-white">
            {typing ? "スキップ" : "次へ"}
          </button>
        ) : (
          <button onClick={restart} className="px-4 py-2 rounded-2xl bg-neutral-800 text-white">
            最初から
          </button>
        )}
      </div>
    </div>
  )
}
