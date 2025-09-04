// app/theme/page.tsx  ← 先頭に "use client" を置かない！
import type { Metadata } from "next";
import ThemeClient from "./ThemeClient";

export const metadata: Metadata = {
  title: "テーマ選択 | Soul Layer",
  description: "テーマを選ぶページ",
};

export default function ThemePage() {
  // Client Component をそのまま描画OK
  return <ThemeClient />;
}
