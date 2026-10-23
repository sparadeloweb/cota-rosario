import { useId, type ReactNode } from "react";
import type { ReportType } from "@/lib/reportTypes";

const WAVE_COUNT = 6;
const WAVE_GAP = 22;
const GRATE_BARS = 9;
const HAZARD_STRIPES = 14;

function wavePath(y: number, amplitude: number): string {
  return `M-20 ${y} C 40 ${y - amplitude}, 80 ${y + amplitude}, 140 ${y} S 260 ${y - amplitude}, 320 ${y} S 420 ${y + amplitude}, 460 ${y}`;
}

function StreetScene() {
  return (
    <>
      {Array.from({ length: WAVE_COUNT }, (_, index) => (
        <path key={index} d={wavePath(170 + index * WAVE_GAP, 7)} fill="none" stroke="currentColor" strokeWidth={index === 0 ? 2.2 : 1.2} strokeOpacity={0.55 - index * 0.07} />
      ))}
      <path d="M250 40v110 M330 40v110" stroke="currentColor" strokeWidth="10" strokeLinecap="round" strokeOpacity="0.22" />
    </>
  );
}

function HomeScene() {
  return (
    <>
      <path d="M230 135 300 78l70 57 M245 124v86h110v-86" fill="none" stroke="currentColor" strokeWidth="9" strokeLinejoin="round" strokeOpacity="0.28" />
      <path d={`${wavePath(168, 6)} V320 H-20 Z`} fill="currentColor" fillOpacity="0.16" />
      <path d={wavePath(168, 6)} fill="none" stroke="currentColor" strokeWidth="2" strokeOpacity="0.6" />
      <path d={wavePath(196, 5)} fill="none" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.35" />
    </>
  );
}

function DrainScene() {
  return (
    <>
      <rect x="200" y="110" width="200" height="90" rx="10" fill="none" stroke="currentColor" strokeWidth="6" strokeOpacity="0.3" />
      {Array.from({ length: GRATE_BARS }, (_, index) => (
        <path key={index} d={`M${216 + index * 21} 122v66`} stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeOpacity="0.24" />
      ))}
      {[0, 1, 2].map((drop) => (
        <circle key={drop} cx={300 + (drop - 1) * 30} cy={232 + drop * 14} r={4 - drop} fill="currentColor" fillOpacity={0.5 - drop * 0.12} />
      ))}
      <path d={wavePath(262, 4)} fill="none" stroke="currentColor" strokeWidth="1.4" strokeOpacity="0.3" />
    </>
  );
}

function ClosureScene({ clipId }: { clipId: string }) {
  return (
    <>
      <clipPath id={clipId}>
        <rect x="170" y="118" width="250" height="56" rx="8" />
      </clipPath>
      <g clipPath={`url(#${clipId})`}>
        <rect x="170" y="118" width="250" height="56" fill="currentColor" fillOpacity="0.12" />
        {Array.from({ length: HAZARD_STRIPES }, (_, index) => (
          <path key={index} d={`M${150 + index * 24} 180 l36 -70`} stroke="currentColor" strokeWidth="11" strokeOpacity="0.38" />
        ))}
      </g>
      <rect x="170" y="118" width="250" height="56" rx="8" fill="none" stroke="currentColor" strokeWidth="2" strokeOpacity="0.45" />
      <path d="M205 174v80 M385 174v80 M185 254h40 M365 254h40" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeOpacity="0.26" />
    </>
  );
}

export function ReportTypeArt({ type, color }: { type: ReportType; color: string }) {
  const id = useId();
  const glowId = `${id}-glow`;
  const scenes: Record<ReportType, ReactNode> = {
    street: <StreetScene />,
    home: <HomeScene />,
    drain: <DrainScene />,
    closure: <ClosureScene clipId={`${id}-clip`} />,
  };
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none"
      viewBox="0 0 400 300"
      preserveAspectRatio="xMaxYMax slice"
      style={{ color }}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={glowId} cx="85%" cy="15%" r="75%">
          <stop offset="0" stopColor="currentColor" stopOpacity="0.32" />
          <stop offset="0.55" stopColor="currentColor" stopOpacity="0.08" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="300" fill={`url(#${glowId})`} />
      {scenes[type]}
    </svg>
  );
}
