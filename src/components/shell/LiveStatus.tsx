import { Suspense } from "react";
import { StatusPill, StatusPillPending } from "@/components/TopBar";
import { OfflineBanner } from "@/components/shell/OfflineBanner";
import { loadStatus } from "@/lib/status";

async function CurrentStatusPill() {
  const { risk } = await loadStatus();
  return <StatusPill level={risk.level} updatedAt={risk.assessedAt} />;
}

async function CurrentOfflineBanner() {
  const { risk } = await loadStatus();
  return <OfflineBanner updatedAt={risk.assessedAt} />;
}

export function LiveStatusPill() {
  return (
    <Suspense fallback={<StatusPillPending />}>
      <CurrentStatusPill />
    </Suspense>
  );
}

export function LiveOfflineBanner() {
  return (
    <Suspense fallback={<OfflineBanner />}>
      <CurrentOfflineBanner />
    </Suspense>
  );
}
