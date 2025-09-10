// /app/api/daily/list/route.ts
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type { PostgrestError } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limitRaw = searchParams.get("limit") ?? "20";
    const user_id = searchParams.get("user_id");
    const diag = searchParams.get("diag") === "1";

    // env の状況は diag 用に保持（実際のクライアントは getSupabaseAdmin 経由）
    const supabaseUrl =
      (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
    const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
    const anonKey = (process.env.SUPABASE_ANON_KEY ?? "").trim();
    const usingServiceRole = serviceKey.length > 0;

    const sb = getSupabaseAdmin();
    if (!sb) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "env_missing: SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
          diag: diag
            ? {
                hasUrl: Boolean(supabaseUrl),
                hasServiceRole: Boolean(serviceKey),
                hasAnon: Boolean(anonKey),
              }
            : undefined,
        },
        { status: 500 }
      );
    }

    const clamp = (n: number, min: number, max: number) =>
      Math.max(min, Math.min(max, Math.floor(n)));
    const limit = clamp(parseInt(limitRaw, 10) || 20, 1, 100);

    let query = sb
      .from("daily_results")
      .select("id, user_id, code, navigator, mode, choice, theme, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (user_id) query = query.eq("user_id", user_id);

    const { data, error } = await query;
    if (error) {
      const e = error as PostgrestError;
      // admin なら基本 403 にならない想定だが、互換のため分岐は残す
      const status =
        e?.code === "PGRST301" || /permission denied/i.test(e?.message || "") ? 403 : 500;
      return NextResponse.json(
        {
          ok: false,
          error: e?.message || "supabase_error",
          diag: diag
            ? {
                code: e?.code ?? null,
                details: e?.details ?? null,
                hint: e?.hint ?? null,
                usingServiceRole,
                urlVarUsed: process.env.SUPABASE_URL ? "SUPABASE_URL" : "NEXT_PUBLIC_SUPABASE_URL",
              }
            : undefined,
        },
        { status }
      );
    }

    // コード正規化（互換）
    const norm = (c: string) => {
      const x = (c || "").trim();
      if (x === "∃" || x === "ヨ") return "Ǝ";
      if (x === "A") return "Λ";
      return ["E", "V", "Λ", "Ǝ"].includes(x) ? x : x;
    };

    const normalized = (data ?? []).map((r: any) => ({ ...r, code: norm(r.code) }));

    return NextResponse.json(
      {
        ok: true,
        data: normalized,
        diag: diag ? { count: normalized.length, usingServiceRole } : undefined,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : typeof err === "string" ? err : "unknown_error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
