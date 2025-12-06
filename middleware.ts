// middleware.ts - EVAE Soul Layer Basic Auth Lock
import { NextRequest, NextResponse } from "next/server";

// 🔐 Basic認証（ここをHiroが好きに変更OK）
const BASIC_USER = "hiro";        // ← ユーザー名
const BASIC_PASS = "evae-2025";   // ← パスワード

export async function middleware(req: NextRequest) {
  const auth = req.headers.get("authorization");

  // 認証ヘッダーがない → ログイン要求
  if (!auth) {
    return new Response("Unauthorized", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="EVAE Soul Layer"',
      },
    });
  }

  // "Basic xxxxx" の形式を解析
  const [scheme, encoded] = auth.split(" ");

  if (scheme !== "Basic" || !encoded) {
    return new Response("Unauthorized", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="EVAE Soul Layer"',
      },
    });
  }

  // Base64 → 平文 "user:pass"
  const decoded = atob(encoded);
  const [user, pass] = decoded.split(":");

  // ID / PASS が一致しない → 認証失敗
  if (user !== BASIC_USER || pass !== BASIC_PASS) {
    return new Response("Unauthorized", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="EVAE Soul Layer"',
      },
    });
  }

  // 認証成功 → 通常処理へ
  return NextResponse.next();
}

// matcher はそのまま使用（静的ファイルなどは除外）
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
