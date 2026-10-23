import { useId } from "react";

interface LogoMarkProps {
  size?: number;
  className?: string;
}

const DEFAULT_SIZE = 30;

export function LogoMark({ size = DEFAULT_SIZE, className = "" }: LogoMarkProps) {
  const gradientId = useId();
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} role="img" aria-label="Cota" fill="none">
      <defs>
        <linearGradient id={gradientId} x1="4" y1="2" x2="28" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3f7f9e" />
          <stop offset="1" stopColor="#173c4e" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill={`url(#${gradientId})`} />
      <rect x="0.5" y="0.5" width="31" height="31" rx="7.5" stroke="#ffffff" strokeOpacity="0.14" />
      <path d="M10.5 8.5h11L16 16.5Z" fill="#f4f6f8" />
      <path d="M7 19h18" stroke="#f4f6f8" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8 24c2.67 0 2.67-1.75 5.33-1.75S16 24 18.67 24s2.66-1.75 5.33-1.75" stroke="#f4f6f8" strokeOpacity="0.62" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="flex items-center gap-3">
      <span className="text-[1.0625rem] font-semibold leading-none tracking-[-0.02em] text-ink">Cota</span>
      <span className="h-6 w-px bg-rule max-sm:hidden" aria-hidden="true" />
      <span className="flex flex-col gap-1 leading-none max-sm:hidden">
        <span className="text-[0.6875rem] font-medium text-ink-soft">Riesgo hídrico</span>
        <span className="readout text-[0.625rem] uppercase tracking-[0.14em] text-ink-faint">Rosario · AR</span>
      </span>
    </span>
  );
}
