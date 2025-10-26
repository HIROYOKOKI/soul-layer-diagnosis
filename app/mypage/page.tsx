// app/mypage/page.tsx
import MyPageClientWrapper from "./MyPageClientWrapper";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

function makeUrl(path: string, origin: string) {
  return path.startsWith("http") ? path : `${origin}${path}`;
}

export default async function MyPagePage() {
  // 現在のホスト/プロトコルから origin を作成（本番/ローカル両対応）
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${proto}://${host}`;

  const opt: RequestInit = { cache: "no-store" };

  const [tRes, qRes, dRes, pRes] = await Promise.all([
    fetch(makeUrl("/api/theme", origin), opt).catch(() => null),
    fetch(makeUrl("/api/mypage/quick-latest", origin), opt).catch(() => null),
    fetch(makeUrl("/api/mypage/daily-latest", origin), opt).catch(() => null),
    fetch(makeUrl("/api/mypage/profile-latest", origin), opt).catch(() => null),
  ]);

  const [tJson, qJson, dJson, pJson] = await Promise.all([
    tRes?.ok ? tRes.json().catch(() => null) : null,
    qRes?.ok ? qRes.json().catch(() => null) : null,
    dRes?.ok ? dRes.json().catch(() => null) : null,
    pRes?.ok ? pRes.json().catch(() => null) : null,
  ]);

  const theme: string | null = tJson?.scope ?? null;
  const quick = qJson?.item ?? null;
  const daily = dJson?.item ?? null;
  const profile = pJson?.item ?? null;

  return (
    <section className="w-screen max-w-none overflow-x-hidden">
      <div className="mx-[calc(50%-50vw)]">
        <div className="mx-auto w-full max-w-[1120px] px-4 sm:px-6 lg:px-8 [&_*]:!max-w-none">
          <MyPageClientWrapper theme={theme} quick={quick} daily={daily} profile={profile} />
        </div>
      </div>
    </section>
  );
}
