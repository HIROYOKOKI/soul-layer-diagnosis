// components/SupabaseProvider.tsx
"use client";
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { createBrowserSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { useState } from "react";
import type { Session } from "@supabase/supabase-js";

export default function SupabaseProvider({
  children,
  session,
}: { children: React.ReactNode; session: Session | null }) {
  const [supabase] = useState(() => createBrowserSupabaseClient());
  return (
    <SessionContextProvider supabaseClient={supabase} initialSession={session}>
      {children}
    </SessionContextProvider>
  );
}
