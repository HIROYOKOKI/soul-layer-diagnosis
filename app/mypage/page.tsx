// app/mypage/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import MyPageClient from "./MyPageClient";

export const dynamic = "force-dynamic"; // 毎回最新を取りたい
export const revalidate = 0;

export default async function MyPagePage() {
  // 1) 認証チェック（Server）
  const sb = createServerComponentClient({ cookies });
  const { data: { user } } = await sb.auth.getUser();

  // 2) 未ログインなら /login へ（next=/mypage を付与）
  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/mypage")}`);
  }

  // 3) 認証済みならクライアントへ（データfetchは /api を叩く）
  return (
    <main className="min-h-[100svh] bg-black text-white">
      <div className="mx-auto w-full max-w-4xl px-5 py-8">
        <MyPageClient />
      </div>
    </main>
  );
}
