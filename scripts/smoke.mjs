// -----------------------------------------------------------------
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
    j = await res.json()
    log(j.ok && Array.isArray(j.data), 'GET /api/daily/list', `count=${j.data?.length ?? 0}`)

    // 追加: JSON shape quick check（各要素に id/code/created_at がある）
    const okShape = Array.isArray(j.data) ? j.data.every(r => r && r.id && 'code' in r && 'created_at' in r) : false
    log(okShape, 'daily/list shape check (id/code/created_at)')

    res = await fetch(`${BASE}/api/theme/set`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
    log(res.status === 400, 'POST /api/theme/set — 400 when theme missing', `status=${res.status}`)

    res = await fetch(`${BASE}/api/daily/list?limit=9999`)
    j = await res.json()
    log(j.ok && Array.isArray(j.data) && j.data.length <= 100, 'GET /api/daily/list limit clamp', `len=${j.data?.length ?? 0}`)

    res = await fetch(`${BASE}/api/daily/list?user_id=__nonexistent__&limit=5`)
    j = await res.json()
    log(j.ok && Array.isArray(j.data), 'GET /api/daily/list user_id filter ok', `count=${j.data?.length ?? 0}`)

  } catch (e) {
    log(false, 'smoke failed', String(e?.message || e))
    process.exitCode = 1
  }
})()
*/
