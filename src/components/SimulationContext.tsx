"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { SimulationResult } from "@/lib/risk";

interface SimulationState {
  scenario: SimulationResult | null;
  version: number;
  setScenario: (scenario: SimulationResult | null) => void;
  reset: () => void;
}

const SimulationContext = createContext<SimulationState>({
  scenario: null,
  version: 0,
  setScenario: () => undefined,
  reset: () => undefined,
});

export function SimulationProvider({ children }: { children: ReactNode }) {
  const [scenario, setScenario] = useState<SimulationResult | null>(null);
  const [version, setVersion] = useState(0);
  const reset = useCallback(() => {
    setScenario(null);
    setVersion((current) => current + 1);
  }, []);
  const value = useMemo(() => ({ scenario, version, setScenario, reset }), [scenario, version, reset]);
  return <SimulationContext.Provider value={value}>{children}</SimulationContext.Provider>;
}

export function useSimulation(): SimulationState {
  return useContext(SimulationContext);
}
