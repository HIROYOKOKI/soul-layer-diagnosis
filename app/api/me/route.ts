// /app/api/me/route.ts
import { NextResponse } from "next/server"

export async function GET() {
// TODO: 実データに差し替え（認証後のユーザー情報）
return NextResponse.json({
plan: "FREE", // or "PREMIUM"
name: "Hiro",
id: "0001",
})
}
