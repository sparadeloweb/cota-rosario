interface LogoProps {
  size?: number;
  className?: string;
}

const DEFAULT_SIZE = 28;

export function LogoMark({ size = DEFAULT_SIZE, className = "" }: LogoProps) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} role="img" aria-label="Cota" fill="none">
      <rect x="1" y="1" width="30" height="30" rx="9" fill="var(--panel-soft)" stroke="var(--rule)" />
      <path d="M9 7v11" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" />
      <path d="M6.5 9h2.5M6.5 12.5h2.5M6.5 16h2.5" stroke="var(--ink)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12.5 11.25 16 13.5l-3.5 2.25Z" fill="var(--atencion)" />
      <path d="M11 20.5c2 0 2-1.6 4-1.6s2 1.6 4 1.6 2-1.6 4-1.6" stroke="var(--water)" strokeWidth="2" strokeLinecap="round" />
      <path d="M11 25c2 0 2-1.6 4-1.6s2 1.6 4 1.6 2-1.6 4-1.6" stroke="var(--water)" strokeWidth="2" strokeLinecap="round" opacity="0.45" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="flex flex-col leading-none">
      <span className="hidden text-base font-semibold tracking-tight text-ink sm:block">Cota</span>
      <span className="meta hidden text-[10px] sm:block">riesgo hídrico · Rosario</span>
    </span>
  );
}
