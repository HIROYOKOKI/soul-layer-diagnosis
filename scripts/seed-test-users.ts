/**
 * scripts/seed-test-users.ts
 * 9名のテストユーザーを admin で一括作成 → 確認済み → BEAKコード発行
 * 既定: No.12〜No.20 を自動発行（No.11は実登録に割当）
 *
 * 使い方:
 *   npx ts-node scripts/seed-test-users.ts \
 *     --prefix yokokihiroshi+u \
 *     --domain gmail.com \
 *     --start 12 \
 *     --count 9 \
 *     --tier beta
 *
 * 必須env:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from "@supabase/supabase-js"

type Args = {
  prefix: string // メールのローカル部の前半 (例: 'yokokihiroshi+u')
  domain: string // ドメイン (例: 'gmail.com')
  start: number  // 連番開始 (例: 12)
  count: number  // 生成人数 (例: 9)
  tier: string   // 会員コードtier (例: 'beta')
}

function parseArgs(): Args {
  const get = (k: string, def?: string) =>
    (process.argv.find(a => a.startsWith(`--${k}=`))?.split("=")[1] ?? def) || ""
  const prefix = get("prefix")
  const domain = get("domain")
  const start = Number(get("start"))
  const count = Number(get("count"))
  const tier = get("tier", "beta")
  if (!prefix || !domain || !start || !count) {
    console.error("Usage: ts-node scripts/seed-test-users.ts --prefix <local> --domain <domain> --start <n> --count <n> [--tier beta]")
    process.exit(1)
  }
  return { prefix, domain, start, count, tier }
}

async function main() {
  const SUPABASE_URL = process.env.SUPABASE_URL
  const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!SUPABASE_URL || !SERVICE_ROLE) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  }
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE)

  const args = parseArgs()
  const pad4 = (n: number) => String(n).padStart(4, "0")
  const seedUsers = Array.from({ length: args.count }, (_, i) => {
    const no = args.start + i // 12..20
    const email = `${args.prefix}${pad4(no)}@${args.domain}` // 例: yokokihiroshi+u0012@gmail.com
    const password = `TempPass!${no}`
    return { no, email, password }
  })

  console.log(`Seeding ${seedUsers.length} users:`, seedUsers.map(u => u.email))

  for (const u of seedUsers) {
    // 1) 確認済みでユーザ作成
    const { data: created, error: e1 } = await admin.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true, // 即「確認済み」
    })
    if (e1) {
      console.error(`× createUser failed: ${u.email}`, e1.message)
      // 重複などの場合はスキップ（必要なら admin.auth.admin.listUsers で拾い直し）
      continue
    }
    const uid = created.user?.id
    console.log(`✓ created: ${u.email} uid=${uid}`)

    // 2) 会員コード発行（RPC: issue_beak_code）
    if (uid) {
      const { data: code, error: e2 } = await admin.rpc("issue_beak_code", {
        p_user_id: uid,
        p_tier: args.tier,
      })
      if (e2) {
        console.error(`× issue_beak_code failed: ${u.email}`, e2.message)
      } else {
        console.log(`✓ code issued: ${u.email} -> ${code.code} (tier=${code.tier})`)
      }
    }
  }

  console.log("Done.")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
