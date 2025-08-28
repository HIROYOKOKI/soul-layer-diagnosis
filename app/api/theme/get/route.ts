=============================================================
// FILE: app/api/theme/get/route.ts
// =============================================================
/**
* Canvas単一ファイル対応のため、`GET` ではなく固有名にしています。
* 本番では `export async function GET()` に戻してください。
*/
export async function GET_API_THEME_GET() {
const c = cookies()
const theme = c.get('theme')?.value ?? '仕事'
const setAt = c.get('theme_set_at')?.value ?? ''
return NextResponse.json({ ok: true, theme, setAt }, { status: 200 })
}
