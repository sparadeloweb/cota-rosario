"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { SimulationResult } from "@/lib/risk";

interface SimulationState {
  escenario: SimulationResult | null;
  version: number;
  setEscenario: (escenario: SimulationResult | null) => void;
  reset: () => void;
}

const SimulationContext = createContext<SimulationState>({
  escenario: null,
  version: 0,
  setEscenario: () => undefined,
  reset: () => undefined,
});

export function SimulationProvider({ children }: { children: ReactNode }) {
  const [escenario, setEscenario] = useState<SimulationResult | null>(null);
  const [version, setVersion] = useState(0);
  const reset = useCallback(() => {
    setEscenario(null);
    setVersion((current) => current + 1);
  }, []);
  const value = useMemo(() => ({ escenario, version, setEscenario, reset }), [escenario, version, reset]);
  return <SimulationContext.Provider value={value}>{children}</SimulationContext.Provider>;
}

export function useSimulation(): SimulationState {
  return useContext(SimulationContext);
}
