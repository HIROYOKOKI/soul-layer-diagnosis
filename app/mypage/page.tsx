import MyPageClientWrapper from './MyPageClientWrapper';

export default async function MyPagePage() {
  const res = await fetch('/api/theme', { cache: 'no-store' }).catch(() => null);
  const json = await res?.json().catch(() => null);
  const theme = json?.scope ?? null;
  return <MyPageClientWrapper theme={theme} />;
}
