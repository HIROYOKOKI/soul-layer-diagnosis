// app/mypage/page.tsx
import MyPageClient from './MyPageClient'

export default async function MyPagePage() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/theme`, {
    cache: 'no-store',
  })
  const json = await res.json()
  const theme = json?.scope ?? null

  return <MyPageClient theme={theme} />
}
