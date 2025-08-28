// -----------------------------------------------------------------
// FILE: app/api/theme/get/route.ts
// -----------------------------------------------------------------
import { NextResponse as NextRespForThemeGet } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
const c = cookies()
const theme = c.get('theme')?.value ?? '仕事'
const setAt = c.get('theme_set_at')?.value ?? ''
return NextRespForThemeGet.json({ ok: true, theme, setAt }, { status: 200 })
}
