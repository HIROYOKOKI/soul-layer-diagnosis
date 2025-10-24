// app/mypage/page.tsx
import MyPageClientWrapper from "./MyPageClientWrapper";

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
    // 🔥 親の max-width を突破して、内側で再センタリング
    <section className="w-screen max-w-none overflow-x-hidden">
      <div className="mx-[calc(50%-50vw)]">
        <div className="mx-auto w-full max-w-[1120px] px-4 sm:px-6 lg:px-8
                        [&_*]:max-w-none">
          {/* ↑ MyPageShell 内の max-width も子孫セレクタで無効化 */}
          <MyPageClientWrapper theme={theme} quick={quick} daily={daily} profile={profile} />
        </div>
      </div>
    </section>
  );
}
