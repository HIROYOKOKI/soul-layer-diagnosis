// app/theme/confirm/page.tsx  ← "use client" は付けない（metadataを使うため）
import type { Metadata } from "next";
import ConfirmClient from "./ConfirmClient";

export const metadata: Metadata = {
  title: "テーマ変更の確認 | Soul Layer",
  description: "テーマ変更時の確認ページ",
};

export default function ConfirmThemePage() {
  return <ConfirmClient />;
}
