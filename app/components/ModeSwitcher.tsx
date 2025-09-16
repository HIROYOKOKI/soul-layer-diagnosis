"use client";
import { useEffect, useState } from "react";

export default function ModeSwitcher() {
  const [mode, setMode] = useState<"pink" | "blue">("blue");

  useEffect(() => {
    try {
      const saved = (localStorage.getItem("mode") as "pink" | "blue") || "blue";
      setMode(saved);
      document.documentElement.dataset.mode = saved === "pink" ? "pink" : "";
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("mode", mode);
      document.documentElement.dataset.mode = mode === "pink" ? "pink" : "";
    } catch {}
  }, [mode]);

  // …
}
