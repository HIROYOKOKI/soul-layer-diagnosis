// app/mypage/page.tsx
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

const SERVER_ENV: "dev" | "prod" =
  process.env.VERCEL_ENV === "production" ? "prod" : "dev"

async function fetchDailyLatest(env: "dev" | "prod"): Promise<DailyLatest | null> {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? ""
  const url = base
    ? `${base}/api/mypage/daily-latest?env=${env}`
    : `/api/mypage/daily-latest?env=${env}`

  try {
    const res = await fetch(url, { cache: "no-store" })
    if (!res.ok) return null
    const json = await res.json()
    return json?.item ?? null
  } catch {
    return null
  }
}

export default async function Page() {
  const dailyLatest = await fetchDailyLatest(SERVER_ENV)
  return <MyPageClient initialDailyLatest={dailyLatest} initialEnv={SERVER_ENV} />
}
