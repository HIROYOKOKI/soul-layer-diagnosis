// scripts/test-supabase.ts
import { config } from "dotenv";
config({ path: ".env.local" }); // ← .env.local を明示的に読み込む

import { createClient } from "@supabase/supabase-js";

// Supabase クライアントを作成
const client = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  console.log("🧩 SUPABASE_URL:", process.env.SUPABASE_URL);
  console.log("🧩 KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "[set]" : "[missing]");

  const { data, error } = await client.from("profiles").select("*").limit(3);

  if (error) {
    console.error("❌ Supabase error:", error.message);
  } else {
    console.log("✅ Supabase OK / first 3 rows:", data);
  }
}

run();
