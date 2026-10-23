interface SparklineProps {
  values: number[];
  marks?: { value: number; color: string }[];
  height?: number;
  color?: string;
}

const WIDTH = 240;
const DEFAULT_HEIGHT = 48;
const PAD = 3;

export function Sparkline({ values, marks = [], height = DEFAULT_HEIGHT, color = "var(--water)" }: SparklineProps) {
  if (values.length < 2) {
    return null;
  }
  const all = [...values, ...marks.map((mark) => mark.value)];
  const min = Math.min(...all);
  const max = Math.max(...all);
  const span = max - min || 1;
  const x = (index: number) => PAD + (index / (values.length - 1)) * (WIDTH - PAD * 2);
  const y = (value: number) => PAD + ((max - value) / span) * (height - PAD * 2);
  const path = values.map((value, index) => `${index === 0 ? "M" : "L"}${x(index).toFixed(1)},${y(value).toFixed(1)}`).join(" ");
  const area = `${path} L${x(values.length - 1).toFixed(1)},${height} L${x(0).toFixed(1)},${height} Z`;
  return (
    <svg viewBox={`0 0 ${WIDTH} ${height}`} className="h-12 w-full" preserveAspectRatio="none" aria-hidden="true">
      {marks.map((mark) => (
        <line key={`${mark.color}-${mark.value}`} x1={PAD} x2={WIDTH - PAD} y1={y(mark.value)} y2={y(mark.value)} stroke={mark.color} strokeDasharray="3 3" strokeWidth="1" />
      ))}
      <path d={area} fill={color} opacity="0.12" />
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      <circle cx={x(values.length - 1)} cy={y(values[values.length - 1])} r="2.5" fill={color} />
    </svg>
  );
}
