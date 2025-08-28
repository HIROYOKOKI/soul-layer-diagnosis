-----------------------------------------------------------------
// (任意) FILE: scripts/smoke.mjs
// -----------------------------------------------------------------
/*
const BASE = process.env.BASE || 'http://localhost:3000'

const log = (ok, name, note='') => {
console.log(`${ok ? '✔' : '✖'} ${name}${note ? ' — ' + note : ''}`)
}

;(async () => {
try {
let res = await fetch(`${BASE}/api/theme/get`)
let j = await res.json()
log(j.ok, 'GET /api/theme/get', `theme=${j.theme}`)

res = await fetch(`${BASE}/api/theme/set`, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ theme: '仕事' })
})
j = await res.json()
log(j.ok, 'POST /api/theme/set', `theme=${j.theme}`)

res = await fetch(`${BASE}/api/daily/list?limit=3`)
const ct = res.headers.get('content-type') || ''
if (!ct.includes('application/json')) {
const t = await res.text()
throw new Error('non-JSON: ' + t.slice(0, 120))
}
j = await res.json()
log(j.ok && Array.isArray(j.data), 'GET /api/daily/list', `count=${j.data?.length ?? 0}`)

} catch (e) {
log(false, 'smoke failed', String(e?.message || e))
process.exitCode = 1
}
})()
*/
