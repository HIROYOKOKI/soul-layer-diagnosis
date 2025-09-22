// app/mypage/page.tsx
import MyPageClientWrapper from './MyPageClientWrapper';

export default async function MyPagePage() {
  // 相対 + no-store で毎回最新を取得（Cookieも同梱）
  const [tRes, qRes] = await Promise.all([
    fetch('/api/theme', { cache: 'no-store' }).catch(() => null),
    fetch('/api/mypage/quick-latest', { cache: 'no-store' }).catch(() => null),
  ]);

  const tJson = await tRes?.json().catch(() => null);
  const qJson = await qRes?.json().catch(() => null);

  const theme: string | null = tJson?.scope ?? null;
  // ⚠️ ここが重要：APIの item をそのまま渡す
  const quick = qJson?.item ?? null;

  return <MyPageClientWrapper theme={theme} quick={quick} />;
}
