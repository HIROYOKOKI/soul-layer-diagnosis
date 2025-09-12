// app/lunea/diagnose/DiagnoseClient.tsx
"use client";
import { useProfileDiagnose } from "../../profile/_hooks/useProfileDiagnose";

export default function DiagnoseClient({ pending }: { pending: any }) {
  const { data, loading, error } = useProfileDiagnose(pending, { enabled: true }); // ★ 明示有効
  // …既存の描画…
}
