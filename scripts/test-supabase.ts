// scripts/test-supabase.ts
import { config } from "dotenv";
config({ path: ".env.local" }); // ← .env.local を明示して読み込む

import { createClient } from "@supabase/supabase-js";

// クライアント作成
const client = createClient(
  process.env.SUPABASE_URL ?? "",
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
);

async function run() {
  console.log("=== ENV CHECK ===");
  console.log("SUPABASE_URL:", process.env.SUPABASE_URL);
  console.log("SERVICE_ROLE_KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "[set]" : "[missing]");
  console.log("=================");

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ 環境変数が読み込まれていません (.env.local)");
    process.exit(1);
  }

  const { data, error } = await client.from("profiles").select("*").limit(3);
  if (error) console.error("❌ Supabase error:", error.message);
  else console.log("✅ Supabase OK / first 3 rows:", data);
}

run();
