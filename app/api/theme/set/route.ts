-----------------------------------------------------------------
// FILE: app/api/theme/set/route.ts
// -----------------------------------------------------------------
import { NextResponse as NextRespForThemeSet } from 'next/server'

export async function POST(req: Request) {
const { theme } = await req.json().catch(() => ({ theme: '' }))
if (!theme || typeof theme !== 'string') {
return NextRespForThemeSet.json({ ok: false, error: 'theme required' }, { status: 400 })
}
const res = NextRespForThemeSet.json({ ok: true, theme })
const maxAge = 60 * 60 * 24 * 365 // 1y
res.cookies.set('theme', theme, { path: '/', maxAge })
res.cookies.set('theme_set_at', new Date().toISOString(), { path: '/', maxAge })
return res
