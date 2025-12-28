// components/SupabaseProvider.tsx
"use client";

import React, { createContext, useContext, useMemo } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getBrowserSupabase } from "@/lib/supabase-browser";

const SupabaseContext = createContext<SupabaseClient | null>(null);

export function useSupabase() {
  const client = useContext(SupabaseContext);
  if (!client) throw new Error("useSupabase must be used within <SupabaseProvider>");
  return client;
}

export default function SupabaseProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // ブラウザで一度だけ生成（lib内でシングルトン化している）
  const supabase = useMemo(() => getBrowserSupabase(), []);

  return <SupabaseContext.Provider value={supabase}>{children}</SupabaseContext.Provider>;
}
