// app/mypage/page.tsx (Server Component)
import MyPageClient from "./MyPageClient"

type EV = "E" | "V" | "Λ" | "Ǝ"
type DailyLatest = {
  code?: EV | null
  comment?: string | null
  quote?: string | null
  scores?: Partial<Record<EV, number>> | null
  raw_interactions?: {
    first_choice?: EV | null
    final_choice?: EV | null
    changes?: number
    subset?: EV[] | null
  } | null
  created_at?: string | null
}

async function fetchDailyLatest(): Promise<DailyLatest | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/mypage/daily-latest`, {
      cache: "no-store",
      // 相対パスでもOKだが、Vercel環境では絶対URLのほうが安定
      // 相対にしたい場合は: await fetch("/api/mypage/daily-latest", { cache: "no-store" })
    })
    if (!res.ok) return null
    const json = await res.json()
    return json?.item ?? null
  } catch {
    return null
  }
}

export default async function Page() {
  const dailyLatest = await fetchDailyLatest()
  return <MyPageClient initialDailyLatest={dailyLatest} />
}
