// lib/luneaTheme.ts
export type EV = "E" | "V" | "Λ" | "Ǝ";

export const evColors: Record<EV, { bg: string; text: string; ring: string }> = {
  E: { bg: "bg-[#001a66]", text: "text-[#66a3ff]", ring: "ring-[#0033ff]" },
  V: { bg: "bg-[#1a004d]", text: "text-[#b399ff]", ring: "ring-[#7d5fff]" },
  Λ: { bg: "bg-[#331a00]", text: "text-[#ffcc80]", ring: "ring-[#ff9f1a]" },
  Ǝ: { bg: "bg-[#0d0026]", text: "text-[#b388ff]", ring: "ring-[#8e44ff]" },
};
