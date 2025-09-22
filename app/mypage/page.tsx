// app/mypage/page.tsx
import MyPageClientWrapper from './MyPageClientWrapper';

export default async function MyPagePage() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/theme`, {
    cache: 'no-store',
  }).catch(() => null);

  const json = await res?.json().catch(() => null);
  const theme = json?.scope ?? null;

  return <MyPageClientWrapper theme={theme} />;
}
