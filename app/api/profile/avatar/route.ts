// app/api/profile/avatar/route.ts
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { randomUUID } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file") as File | null;
  const userId = form.get("user_id") as string | null;
  if (!file || !userId) {
    return NextResponse.json({ ok: false, error: "missing_file_or_user" }, { status: 400 });
  }

  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ ok:false, error:"supabase_env_missing" }, { status:500 });

  // 拡張子
  const ext = (file.name?.split(".").pop() || "png").toLowerCase();
  const objectPath = `${userId}/${randomUUID()}.${ext}`;

  // 1) Storage へ保存
  const { error: upErr } = await sb.storage.from("avatars").upload(objectPath, file, {
    cacheControl: "3600",
    upsert: true,
    contentType: file.type || `image/${ext}`,
  });
  if (upErr) return NextResponse.json({ ok:false, error: upErr.message }, { status:500 });

  // 2) 公開URL取得
  const { data: pub } = sb.storage.from("avatars").getPublicUrl(objectPath);
  const url = pub.publicUrl;

  // 3) profiles.avatar_url を更新（テーブル名はプロジェクトに合わせて）
  const { error: updErr } = await sb.from("profiles").update({ avatar_url: url }).eq("id", userId);
  if (updErr) return NextResponse.json({ ok:false, error: updErr.message }, { status:500 });

  return NextResponse.json({ ok:true, url });
}
