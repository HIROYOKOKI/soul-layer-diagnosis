// app/mypage/page.tsx
import MyPageClientWrapper from './MyPageClientWrapper';

export default async function MyPagePage() {
  const [tRes, qRes] = await Promise.all([
    fetch('/api/theme', { cache: 'no-store' }).catch(() => null),
    fetch('/api/mypage/quick-latest', { cache: 'no-store' }).catch(() => null),
  ]);

  const tJson = await tRes?.json().catch(() => null);
  const qJson = await qRes?.json().catch(() => null);

  const theme: string | null = tJson?.scope ?? null;

  // API 期待形: { ok:true, item:{ model:'EVΛƎ'|'EΛVƎ', order:['E','V','Λ','Ǝ'], created_at:'...' } }
  const quick = qJson?.item ?? null;

  return <MyPageClientWrapper theme={theme} quick={quick} />;
}
