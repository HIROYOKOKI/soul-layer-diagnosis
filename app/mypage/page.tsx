// app/mypage/page.tsx
import MyPageClientWrapper from './MyPageClientWrapper';

export default async function MyPagePage() {
  const res = await fetch('/api/theme', { cache: 'no-store' }).catch(() => null);
  const json = await res?.json().catch(() => null);
  const theme: string | null = json?.scope ?? null; // "WORK" | "LOVE" | "FUTURE" | "LIFE" | null
  return <MyPageClientWrapper theme={theme} />;
}
