// components/AuthSync.tsx
"use client";
import { useEffect } from "react";
import { getBrowserSupabase } from "@/lib/supabase-browser";

export default function AuthSync() {
  useEffect(() => {
    const sb = getBrowserSupabase();
    const { data: sub } = sb.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        await fetch("/api/auth/callback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ event, session }),
        });
      }
      if (event === "SIGNED_OUT") {
        await fetch("/api/auth/callback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ event }),
        });
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);
  return null;
}
