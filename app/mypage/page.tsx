// app/mypage/page.tsx (SERVER)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { redirect } from "next/navigation";
import MyPageClient from "./MyPageClient";
import { createSupabaseServerClient } from "@/app/_utils/supabase/server";

export default async function Page() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 最低限 userId だけ渡す（まずこれで No Name が消える）
  return <MyPageClient initialData={{}} userId={user.id} />;
}
