/ /app/api/me/route.ts
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
process.env.NEXT_PUBLIC_SUPABASE_URL!,
process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
try {
// TODO: 認証後のユーザーIDを使う（今は最初の1件を仮取得）
const { data, error } = await supabase
.from("profiles")
.select("id, name, plan")
.limit(1)
.maybeSingle()

if (error) throw error

return NextResponse.json({
plan: (data?.plan ?? "FREE").toUpperCase(),
name: data?.name ?? "Hiro",
id: String(data?.id ?? "0001"),
})
} catch (e) {
// フォールバック
return NextResponse.json({ plan: "FREE", name: "Hiro", id: "0001" })
}
