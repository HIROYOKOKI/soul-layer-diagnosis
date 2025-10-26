// ✅ これが一番上に必要（.env.local を読み込む）
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

// Supabaseクライアントを作成
const sb = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log("🧩 SUPABASE_URL:", process.env.SUPABASE_URL);
  console.log("🧩 KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "[set]" : "[missing]");

  const { data, error } = await sb.from("profiles").select("*").limit(3);
  if (error) {
    console.error("❌ Supabase error:", error.message);
  } else {
    console.log("✅ Supabase OK / first 3 rows:", data);
  }
}

main();
