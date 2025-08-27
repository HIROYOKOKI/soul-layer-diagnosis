// app/api/structure/quick/save/route.ts
export const runtime = 'nodejs'
const hasUrl  = !!process.env.SUPABASE_URL
const hasRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY
if (!hasUrl || !hasRole) {
  return NextResponse.json(
    { ok:false, error:`ENV_MISSING: url=${hasUrl?'set':'missing'}, role=${hasRole?'set':'missing'}` },
    { status:500 }
  )
}
