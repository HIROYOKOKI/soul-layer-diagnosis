// app/mypage/page.tsx
import MyPageClientWrapper from "./MyPageClientWrapper";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

function makeUrl(path: string, origin: string) {
  return path.startsWith("http") ? path : `${origin}${path}`;
}

export default async function MyPagePage() {
  // 現在のホスト/プロトコルから origin を作成（本番/ローカル両対応）
  const h = await headers();
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

  // ===== ガード =====
  // 未ログインならログインへ（どれかが unauthenticated を返していたら弾く）
  if (tJson?.unauthenticated || pJson?.unauthenticated || qJson?.unauthenticated || dJson?.unauthenticated) {
    redirect("/login");
  }

  // /api/theme は { value } or { scope } のどちらかで返る実装があるため両対応
  const theme: string | null = (tJson?.value ?? tJson?.scope ?? null) as string | null;

  // テーマ未選択ならテーマ選択へ強制誘導（本番フロー固定）
  if (!theme) {
    redirect("/theme");
  }

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
