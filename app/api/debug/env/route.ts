// app/api/debug/env/route.ts
import { NextResponse } from "next/server";
export async function GET() {
  return NextResponse.json({
    ok: true,
    use_openai: process.env.USE_OPENAI === "true",
    openai_key_present: Boolean(process.env.OPENAI_API_KEY),
    runtime: "nodejs",
  });
}
