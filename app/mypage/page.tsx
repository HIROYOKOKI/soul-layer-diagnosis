// app/mypage/page.tsx  （Server Component）
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import MyPageClient from "./MyPageClient";

export default async function MyPage() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login?next=/mypage");
  return <MyPageClient />;
}
