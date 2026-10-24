interface LogoMarkProps {
  size?: number;
  className?: string;
}

const DEFAULT_SIZE = 34;
const WORDMARK_HEIGHT = 24;
const WORDMARK_VIEWBOX = { x: 2, y: 46, width: 478, height: 174 };
const BRAND = {
  sky: "#74ACDF",
  deep: "#4F8FCB",
  face: "#15304D",
  white: "#FFFFFF",
  letters: "#8EC1EC",
} as const;

export function LogoMark({ size = DEFAULT_SIZE, className = "" }: LogoMarkProps) {
  return (
    <svg viewBox="16 22 224 224" width={size} height={size} className={className} role="img" aria-label="Cota">
      <path fill={BRAND.sky} d="M118 40Q128 24 138 40C161 74 208 120 208 164A80 80 0 0 1 48 164C48 120 95 74 118 40Z" />
      <path fill={BRAND.deep} d="M59.9 206Q94 199 128 206Q162 213 196.1 206A80 80 0 0 1 59.9 206Z" />
      <path fill={BRAND.white} d="M80 136a21 25 0 1 0 42 0a21 25 0 1 0-42 0Z M134 136a21 25 0 1 0 42 0a21 25 0 1 0-42 0Z" />
      <circle cx="106" cy="141" r="11" fill={BRAND.face} />
      <circle cx="160" cy="141" r="11" fill={BRAND.face} />
      <circle cx="101" cy="133" r="4" fill={BRAND.white} />
      <circle cx="155" cy="133" r="4" fill={BRAND.white} />
      <path fill={BRAND.face} d="M111 174Q128 186.75 145 174A5 5 0 0 1 151 182Q128 199.25 105 182A5 5 0 0 1 111 174Z" />
    </svg>
  );
}

function WordmarkLetters() {
  const { x, y, width, height } = WORDMARK_VIEWBOX;
  return (
    <svg viewBox={`${x} ${y} ${width} ${height}`} height={WORDMARK_HEIGHT} width={(WORDMARK_HEIGHT * width) / height} role="img" aria-label="cota">
      <g transform="translate(-20 0)" fill={BRAND.letters}>
        <path d="M142.56 107.58A66 66 0 1 0 142.56 192.42A18 18 0 0 0 114.98 169.28A30 30 0 1 1 114.98 130.72A18 18 0 0 0 142.56 107.58Z" />
        <path fillRule="evenodd" d="M144 150a66 66 0 1 0 132 0a66 66 0 1 0 -132 0Z M180 150a30 30 0 1 1 60 0a30 30 0 1 1 -60 0Z" />
        <path d="M300 68A18 18 0 0 1 336 68V166A18 18 0 0 1 300 166Z" />
        <path d="M300 166A50 50 0 0 0 350 216A18 18 0 0 0 350 180A14 14 0 0 1 336 166Z" />
        <path d="M298 90H344A18 18 0 0 1 344 126H298A18 18 0 0 1 298 90Z" />
        <path fillRule="evenodd" d="M364 150a66 66 0 1 0 132 0a66 66 0 1 0 -132 0Z M400 150a30 30 0 1 1 60 0a30 30 0 1 1 -60 0Z" />
        <path d="M460 102A18 18 0 0 1 496 102V198A18 18 0 0 1 460 198Z" />
        <path fill={BRAND.deep} d="M180.61 156Q195.3 150 210 156Q224.7 162 239.39 156A30 30 0 0 1 180.61 156Z" />
      </g>
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="flex items-center gap-3">
      <WordmarkLetters />
      <span className="h-6 w-px bg-rule max-sm:hidden" aria-hidden="true" />
      <span className="flex flex-col gap-1 leading-none max-sm:hidden">
        <span className="text-[0.6875rem] font-medium text-ink-soft">Riesgo hídrico</span>
        <span className="readout text-[0.625rem] uppercase tracking-[0.14em] text-ink-faint">Rosario · AR</span>
      </span>
    </span>
  );
}
