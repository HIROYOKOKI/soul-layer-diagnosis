import MyPageClientWrapper from './MyPageClientWrapper';

export default async function MyPagePage() {
  const [tRes, qRes] = await Promise.all([
    fetch('/api/theme', { cache:'no-store' }).catch(()=>null),
    fetch('/api/mypage/quick-latest', { cache:'no-store' }).catch(()=>null),
  ]);
  const t = await tRes?.json().catch(()=>null);
  const q = await qRes?.json().catch(()=>null);
  return <MyPageClientWrapper theme={t?.scope ?? null} quick={q?.item ?? null} />;
}
