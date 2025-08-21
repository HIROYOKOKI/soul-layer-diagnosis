<<<<<<< HEAD
// app/api/health/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ ok: true, ts: Date.now() })
}

=======
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ ok: true, ts: Date.now(), endpoint: '/api/health' })
}
>>>>>>> 81de7de (assets: add login-intro.mp4 / login-still.png)
