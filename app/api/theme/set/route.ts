FILE: app/api/theme/set/route.ts
// =============================================================
/**
* Canvas単一ファイル対応のため、`POST` ではなく固有名にしています。
* 本番では `export async function POST(req: Request)` に戻してください。
*/
export async function POST_API_THEME_SET(req: Request) {
const { theme } = await req.json().catch(() => ({ theme: '' }))
if (!theme || typeof theme !== 'string') {
return NextResponse.json({ ok: false, error: 'theme required' }, { status: 400 })
}
const res = NextResponse.json({ ok: true, theme })
const maxAge = 60 * 60 * 24 * 365 // 1y
res.cookies.set('theme', theme, { path: '/', maxAge })
res.cookies.set('theme_set_at', new Date().toISOString(), { path: '/', maxAge })
return res
  }
