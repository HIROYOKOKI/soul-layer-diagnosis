// app/(site)/layout.tsx
import type { ReactNode } from "react";
import AppHeader from "../components/AppHeader"; // 相対パスで

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AppHeader />
      {children}
    </>
  );
}
