import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const userId = formData.get("user_id") as string;

  if (!file || !userId) {
    return NextResponse.json({ ok: false, error: "missing_file_or_user" }, { status: 400 });
  }

  const sb = getSupabaseAdmin();
  const fileName = `${userId}/${uuidv4()}.png`;

  // 1) ストレージ保存
  const { error: uploadError } = await sb.storage
    .from("avatars")
    .upload(fileName, file, { upsert: true });

  if (uploadError) {
    return NextResponse.json({ ok: false, error: uploadError.message }, { status: 500 });
  }

  const { data: urlData } = sb.storage.from("avatars").getPublicUrl(fileName);

  // 2) DB 更新
  const { error: updateError } = await sb
    .from("profiles")
    .update({ avatar_url: urlData.publicUrl })
    .eq("id", userId);

  if (updateError) {
    return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, url: urlData.publicUrl });
}
