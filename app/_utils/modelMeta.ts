// app/_utils/modelMeta.ts
export type Model = "EΛVƎ" | "EVΛƎ" | null;

/** 型バッジの色とラベルを返す */
export function modelMeta(model: Model) {
  if (model === "EΛVƎ") return { color: "#B833F5", label: "EΛVƎ:現実思考型" }; // 紫
  if (model === "EVΛƎ") return { color: "#FF4500", label: "EVΛƎ:未来志向型" }; // オレンジ
  return { color: "#888888", label: "" };
}
