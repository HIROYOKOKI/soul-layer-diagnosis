// app/mypage/page.tsx
import MyPageClientWrapper from './MyPageClientWrapper';

export default async function MyPagePage() {
  // 相対URL + no-store → Cookieが必ず乗る＆常に最新
  const res = await fetch('/api/theme', { cache: 'no-store' }).catch(() => null);
  const json = await res?.json().catch(() => null);
  const theme: string | null = json?.scope ?? null; // "WORK" | "LOVE" | "FUTURE" | "LIFE" | null

  return <MyPageClientWrapper theme={theme} />;
}
