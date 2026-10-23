interface LogoMarkProps {
  size?: number;
  className?: string;
}

const DEFAULT_SIZE = 34;
const SUN_RAYS = "M47.0 7.3L47.0 3.9 M53.5 10.0L55.9 7.6 M56.2 16.5L59.6 16.5 M53.5 23.0L55.9 25.4 M47.0 25.7L47.0 29.1 M40.5 23.0L38.1 25.4 M37.8 16.5L34.4 16.5 M40.5 10.0L38.1 7.6";
const BRAND = {
  sky: "#74ACDF",
  skyShadow: "#4F8FCB",
  sun: "#F6B40E",
  drop: "#FFFFFF",
  dropShade: "#D7E8F7",
  face: "#15304D",
  cheek: "#F49BB0",
} as const;

export function LogoMark({ size = DEFAULT_SIZE, className = "" }: LogoMarkProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} role="img" aria-label="Cota" fill="none">
      <rect width="64" height="64" rx="18" fill={BRAND.skyShadow} />
      <rect width="64" height="60" rx="18" fill={BRAND.sky} />
      <path d={SUN_RAYS} stroke={BRAND.sun} strokeWidth="3.4" strokeLinecap="round" />
      <circle cx="47" cy="16.5" r="6.6" fill={BRAND.sun} />
      <path d="M27.4 12.4Q29 10.1 30.6 12.4C34.6 18 43.5 28.4 43.5 37.5a14.5 14.5 0 0 1-29 0C14.5 28.4 23.4 18 27.4 12.4Z" fill={BRAND.drop} />
      <path d="M43.5 37.5a14.5 14.5 0 0 1-21.8 12.5C30.5 51 39 45 39.4 33.8c.1-3-1-6.3-2.6-9.6C40.8 29.3 43.5 34 43.5 37.5Z" fill={BRAND.dropShade} />
      <ellipse cx="23.6" cy="37" rx="3.1" ry="4" fill={BRAND.face} />
      <ellipse cx="33.4" cy="37" rx="3.1" ry="4" fill={BRAND.face} />
      <circle cx="24.6" cy="35.4" r="1.2" fill={BRAND.drop} />
      <circle cx="34.4" cy="35.4" r="1.2" fill={BRAND.drop} />
      <ellipse cx="19.6" cy="42.4" rx="2.6" ry="1.7" fill={BRAND.cheek} fillOpacity="0.55" />
      <ellipse cx="37.4" cy="42.4" rx="2.6" ry="1.7" fill={BRAND.cheek} fillOpacity="0.55" />
      <path d="M24.8 44.2c2.4 2.4 5.8 2.4 8.2 0" stroke={BRAND.face} strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="flex items-center gap-3">
      <span className="font-brand text-[1.6rem] font-black lowercase leading-none tracking-[-0.03em] text-[#8EC1EC]">cota</span>
      <span className="h-6 w-px bg-rule max-sm:hidden" aria-hidden="true" />
      <span className="flex flex-col gap-1 leading-none max-sm:hidden">
        <span className="text-[0.6875rem] font-medium text-ink-soft">Riesgo hídrico</span>
        <span className="readout text-[0.625rem] uppercase tracking-[0.14em] text-ink-faint">Rosario · AR</span>
      </span>
    </span>
  );
}
