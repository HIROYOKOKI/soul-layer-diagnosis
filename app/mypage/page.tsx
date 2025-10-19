// app/mypage/page.tsx
import MyPageClientWrapper from "./MyPageClientWrapper";

export default async function MyPagePage() {
  // 相対 + no-store で毎回最新を取得（Cookieも同梱）
  const [tRes, qRes, dRes, pRes] = await Promise.all([
    fetch("/api/theme", { cache: "no-store" }).catch(() => null),
    fetch("/api/mypage/quick-latest", { cache: "no-store" }).catch(() => null),
    fetch("/api/mypage/daily-latest", { cache: "no-store" }).catch(() => null),
    fetch("/api/mypage/profile-latest", { cache: "no-store" }).catch(() => null),
  ]);

  const tJson = await tRes?.json().catch(() => null);
  const qJson = await qRes?.json().catch(() => null);
  const dJson = await dRes?.json().catch(() => null);
  const pJson = await pRes?.json().catch(() => null);

  const theme: string | null = tJson?.scope ?? null;
  const quick = qJson?.item ?? null;
  const daily = dJson?.item ?? null;
  const profile = pJson?.item ?? null;

  return (
    <MyPageClientWrapper
      theme={theme}
      quick={quick}
      daily={daily}
      profile={profile}
    />
  );
}
