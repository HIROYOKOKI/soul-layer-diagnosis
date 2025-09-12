// app/profile/confirm/ConfirmClient.tsx
"use client";
import { useProfileDiagnose } from "../_hooks/useProfileDiagnose";

export default function ConfirmClient({ pending }: { pending: any }) {
  const { data, loading, error } = useProfileDiagnose(pending, { enabled: true }); // ★ 明示有効
  // …既存の描画…
}
