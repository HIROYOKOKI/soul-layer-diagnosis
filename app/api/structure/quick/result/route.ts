// app/api/structure/quick/result/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type Row = {
  id: string;
  type_key: "EVΛƎ" | "EΛVƎ";
  type_label: string;
  comment: string | null;
  advice: string | null;
  created_at: string;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ ok: false, error: "missing id" }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return NextResponse.json({ ok: false, error: "supabase env not set" }, { status: 500 });
  }

  const supabase = createClient(url, key);

  const { data, error } = await supabase
    .from("quick_results")
    .select("id,type_key,type_label,comment,advice,created_at")
    .eq("id", id)
    .limit(1)
    .maybeSingle<Row>();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });
  }

  const res = {
    id: data.id,
    typeKey: data.type_key,
    typeLabel: data.type_label,
    comment: data.comment,
    advice: data.advice,
    createdAt: data.created_at,
  };

  return NextResponse.json({ ok: true, item: res }, { status: 200 });
}
