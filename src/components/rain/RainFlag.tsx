"use client";

import { useEffect } from "react";
import type { RainIntensity } from "@/lib/weather";

export function RainFlag({ intensity }: { intensity: RainIntensity | null }) {
  useEffect(() => {
    const root = document.documentElement;
    if (intensity) {
      root.dataset.rain = intensity;
    } else {
      delete root.dataset.rain;
    }
    return () => {
      delete root.dataset.rain;
    };
  }, [intensity]);
  return null;
}
