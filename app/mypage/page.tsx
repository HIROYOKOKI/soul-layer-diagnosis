// app/mypage/page.tsx
import MyPageClientWrapper from "./MyPageClientWrapper";
import { default as nextDynamic } from "next/dynamic"; // ← 別名に変更！

// レーダーチャートをSSR無効で読み込み
const RadarCard = nextDynamic(() => import("./RadarCard"), { ssr: false });

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MyPagePage() {
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
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
      <MyPageClientWrapper theme={theme} quick={quick} daily={daily} profile={profile} />
      <RadarCard />
    </div>
  );
}
