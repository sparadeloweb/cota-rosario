import { loadStatus } from "@/lib/status";
import { loadKpis } from "@/lib/kpis";
import { loadPredictions } from "@/lib/predictions";
import { buildSituationReport, buildRecommendations } from "@/lib/recommendations";

export async function loadPanel() {
  const statusPromise = loadStatus();
  const [status, kpis, predictions] = await Promise.all([statusPromise, loadKpis(statusPromise), loadPredictions(statusPromise)]);
  const failureOf = (source: string) => status.failures.find((failure) => failure.source === source);
  return {
    status,
    kpis,
    predictions,
    recommendations: buildRecommendations({ status, kpis, predictions }),
    situationReport: buildSituationReport({ status, kpis, predictions }),
    failureOf,
  };
}

export type PanelData = Awaited<ReturnType<typeof loadPanel>>;
