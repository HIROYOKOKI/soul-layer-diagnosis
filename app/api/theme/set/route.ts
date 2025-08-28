/ FILE: app/api/theme/set/route.ts
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
// JSON安全パース（非JSONや空ボディでも落ちない）
let body: unknown = null
try {
body = await req.json()
} catch {
body = {}
}
const themeRaw = (body as { theme?: unknown })?.theme
const theme = typeof themeRaw === 'string' ? themeRaw.trim() : ''

if (!theme) {
return NextResponse.json({ ok: false, error: 'theme required' }, { status: 400 })
}

const res = NextResponse.json({ ok: true, theme })
const maxAge = 60 * 60 * 24 * 365 // 1y
res.cookies.set('theme', theme, { path: '/', maxAge })
res.cookies.set('theme_set_at', new Date().toISOString(), { path: '/', maxAge })
return res
}
