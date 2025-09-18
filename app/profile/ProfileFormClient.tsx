"use client"

import { useState, type FormEvent, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { Calendar, User, Clock, MapPin, Heart } from "lucide-react"
import GlowButton from "@/components/GlowButton"

type Pending = {
  name: string
  birthday: string
  birthTime: string | null
  birthPlace: string | null
  sex: "Male" | "Female" | "Other" | ""
  preference: "Female" | "Male" | "Both" | "None" | "Other" | "" | null
}

export default function ProfileFormClient() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const f = new FormData(e.currentTarget)

    const rawPref = String(f.get("preference") || "")
    const pending: Pending = {
      name: String(f.get("name") || ""),
      birthday: String(f.get("birthday") || ""),
      birthTime: (String(f.get("birthTime") || "") || "").trim() === "" ? null : String(f.get("birthTime")),
      birthPlace: (String(f.get("birthPlace") || "") || "").trim() === "" ? null : String(f.get("birthPlace")),
      sex: String(f.get("sex") || "") as Pending["sex"],
      preference: rawPref === "" ? null : (rawPref as Pending["preference"]),
    }

    try {
      sessionStorage.setItem("profile_pending", JSON.stringify(pending))
      router.push("/profile/confirm")
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-8 sm:py-12">
      <div className="mb-8 text-center">
        <h1 className="text-xl font-bold tracking-wide text-white/90 sm:text-2xl">プロフィール入力</h1>
        <p className="mt-1 text-sm text-white/50 sm:text-base">診断に必要な最小限の情報だけを入力してください</p>
      </div>
      <div className="relative rounded-2xl bg-white/[0.03] p-8 shadow-[0_0_40px_rgba(184,51,245,0.08)] backdrop-blur min-h-[520px]">
        <form onSubmit={handleSubmit} className="relative grid gap-6">
          <Field label="ニックネーム" icon={<User className="h-4 w-4" />} required>
            <input name="name" type="text" required placeholder="例：hiro" className={inputCls} />
          </Field>
          <Field label="誕生日" icon={<Calendar className="h-4 w-4" />} required hint="YYYY-MM-DD 形式">
            <input name="birthday" type="date" required className={inputCls} />
          </Field>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Field label="出生時間（任意）" icon={<Clock className="h-4 w-4" />}>
              <input name="birthTime" type="time" className={inputCls} />
            </Field>
            <Field label="出生地（任意）" icon={<MapPin className="h-4 w-4" />}>
              <input name="birthPlace" type="text" placeholder="日本、東京都/Tokyo, JP  など" className={inputCls} />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Field label="性別（任意）" icon={<Heart className="h-4 w-4" />}>
              <select name="sex" defaultValue="" className={inputCls}>
                <option value="">選択しない</option>
                <option value="Male">男性</option>
                <option value="Female">女性</option>
                <option value="Other">その他</option>
              </select>
            </Field>
            <Field label="恋愛対象（任意）">
              <select name="preference" defaultValue="" className={inputCls}>
                <option value="">選択しない</option>
                <option value="Female">女性</option>
                <option value="Male">男性</option>
                <option value="Both">どちらも</option>
                <option value="None">なし</option>
                <option value="Other">その他</option>
              </select>
            </Field>
          </div>
          <div className="pt-6">
            <GlowButton type="submit" variant="primary" size="sm" disabled={loading} className="w-full h-12">
              {loading ? "送信中…" : "確認へ"}
            </GlowButton>
          </div>
          {error && <p className="text-sm text-red-400 text-right">エラー：{error}</p>}
        </form>
      </div>
    </div>
  )
}

function Field({
  label,
  required,
  icon,
  hint,
  children,
}: {
  label: string
  required?: boolean
  icon?: ReactNode
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm font-medium text-white/90">
          {icon && <span className="text-cyan-300/80">{icon}</span>}
          <span>{label}</span>
          {required && (
            <span className="ml-1 rounded bg-fuchsia-500/20 px-1.5 py-0.5 text-[10px] text-fuchsia-300">必須</span>
          )}
        </label>
        {hint && <span className="text-xs text-white/40">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

const inputCls =
  "w-full rounded-xl bg-white/5 px-3.5 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:ring-2 focus:ring-fuchsia-400/30"
