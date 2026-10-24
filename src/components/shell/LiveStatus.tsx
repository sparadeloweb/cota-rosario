import { Suspense } from "react";
import { StatusPill, StatusPillPending } from "@/components/TopBar";
import { OfflineBanner } from "@/components/shell/OfflineBanner";
import { HeaderWeather } from "@/components/WeatherBadge";
import { loadStatus } from "@/lib/status";

async function CurrentStatusPill() {
  const { risk } = await loadStatus();
  return <StatusPill level={risk.level} updatedAt={risk.assessedAt} />;
}

async function CurrentWeather() {
  const { weather } = await loadStatus();
  return <HeaderWeather weather={weather} />;
}

async function CurrentOfflineBanner() {
  const { risk } = await loadStatus();
  return <OfflineBanner updatedAt={risk.assessedAt} />;
}

export function LiveStatusPill() {
  return (
    <>
      <Suspense fallback={null}>
        <CurrentWeather />
      </Suspense>
      <Suspense fallback={<StatusPillPending />}>
        <CurrentStatusPill />
      </Suspense>
    </>
  );
}

export function LiveOfflineBanner() {
  return (
    <Suspense fallback={<OfflineBanner />}>
      <CurrentOfflineBanner />
    </Suspense>
  );
}
