import { NextResponse, type NextRequest } from "next/server"
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"

const PUBLIC = [
  "/",
  "/welcome",
  "/welcome/lunea",
  "/intro",
  "/login",
  "/signup",
  "/reset",
  "/legal",
  "/contact",
]

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // セッション同期（これが重要）
  await supabase.auth.getSession()

  const { pathname } = req.nextUrl
  const isPublic = PUBLIC.some((p) => pathname === p || pathname.startsWith(p + "/"))
  if (isPublic) return res

  return res
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
