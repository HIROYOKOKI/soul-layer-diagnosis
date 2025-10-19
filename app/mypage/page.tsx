// app/mypage/page.tsx
// ※ 'use client' は置かない（サーバーコンポーネント）
import MyPageClientWrapper from './MyPageClientWrapper';

export default async function MyPagePage() {
  // Cookie を持ったままSSRで読むため相対パス＆no-store
  const res = await fetch('/api/theme', { cache: 'no-store' });
  const json = await res.json().catch(() => null);
  const theme = json?.scope ?? null; // WORK/LOVE/FUTURE/LIFE or null

  return <MyPageClientWrapper theme={theme} />;
}
