"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

type EV = "E" | "V" | "Λ" | "Ǝ"

const CHOICES: Array<{ code: EV; label: string; desc: string }> = [
  { code: "E", label: "E（衝動・情熱）", desc: "やりたいことを迷わず行動に移す力" },
  { code: "V", label: "V（可能性・夢）", desc: "まだ見ぬ未来や夢を追いかける心" },
  { code: "Λ", label: "Λ（選択・葛藤）", desc: "悩みながらも自分で選び取る自由" },
  { code: "Ǝ", label: "Ǝ（観測・静寂）", desc: "ものごとを見つめ、意味を感じ取る時間" },
]

export default function ConfirmPage() {
  const router = useRouter()
  const [order, setOrder] = useState<EV[]>([])

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("structure_quick_pending")
      const p = raw ? JSON.parse(raw) : null
      if (!p?.order || p.order.length !== 4) {
        router.replace("/structure/quick")
      } else {
        setOrder(p.order)
      }
    } catch {
      router.replace("/structure/quick")
    }
  }, [router])

  const getChoice = (code: EV) => CHOICES.find((c) => c.code === code)!

  return (
    <div className="min-h-screen grid place-items-center bg-black text-white px-5">
      <div className="w-full max-w-md py-10">
        <h1 className="text-center text-xl font-bold mb-6">確認</h1>

        <ol className="space-y-3 mb-8">
          {order.map((code, i) => {
            const c = getChoice(code)
            return (
              <li
                key={code}
                className="rounded-xl border border-white/10 bg-white/5 p-4"
              >
                <div className="font-semibold">{`第${i + 1}位：${c.label}`}</div>
                <p className="text-sm text-white/80 mt-1">{c.desc}</p>
              </li>
            )
          })}
        </ol>

        <div className="grid gap-3">
          <button
            className="w-full rounded-lg bg-pink-600 py-2 font-bold hover:bg-pink-500"
            onClick={() => router.push("/structure/quick/result")}
          >
            この内容で診断
          </button>
          <button
            className="w-full rounded-lg border border-white/20 py-2 text-white/90 hover:bg-white/10"
            onClick={() => router.replace("/structure/quick")}
          >
            修正する（戻る）
          </button>
        </div>
      </div>
    </div>
  )
}
