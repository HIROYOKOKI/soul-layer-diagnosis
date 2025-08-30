import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;

export async function GET() {
  // env 未設定ならダミー応答
  if (!url || !key) {
    return NextResponse.json({ plan: "FREE", name: "Hiro", id: "0001" });
  }

  const supabase = createClient(url, key);

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, name, plan")
      .limit(1)
      .maybeSingle<{ id: string | number; name: string | null; plan: string | null }>();

    if (error) throw error;

    return NextResponse.json({
      plan: String(data?.plan ?? "FREE").toUpperCase(),
      name: data?.name ?? "Hiro",
      id: String(data?.id ?? "0001"),
    });
  } catch (_err) {
    return NextResponse.json({ plan: "FREE", name: "Hiro", id: "0001" });
  }
}
