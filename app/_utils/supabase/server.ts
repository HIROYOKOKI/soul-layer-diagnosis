import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          // ✅ 3引数形式（あなたの環境で確実に動く）
          cookieStore.set(name, value, options);
        },
        remove(name: string, options: any) {
          // ✅ cookie削除も3引数形式で統一
          cookieStore.set(name, "", { ...options, maxAge: 0 });
        },
      },
    }
  );
}
