interface SparklineProps {
  valores: number[];
  marcas?: { valor: number; color: string }[];
  alto?: number;
  color?: string;
}

const WIDTH = 240;
const DEFAULT_HEIGHT = 48;
const PAD = 3;

export function Sparkline({ valores, marcas = [], alto = DEFAULT_HEIGHT, color = "var(--water)" }: SparklineProps) {
  if (valores.length < 2) {
    return null;
  }
  const todos = [...valores, ...marcas.map((marca) => marca.valor)];
  const min = Math.min(...todos);
  const max = Math.max(...todos);
  const span = max - min || 1;
  const x = (index: number) => PAD + (index / (valores.length - 1)) * (WIDTH - PAD * 2);
  const y = (valor: number) => PAD + ((max - valor) / span) * (alto - PAD * 2);
  const path = valores.map((valor, index) => `${index === 0 ? "M" : "L"}${x(index).toFixed(1)},${y(valor).toFixed(1)}`).join(" ");
  const area = `${path} L${x(valores.length - 1).toFixed(1)},${alto} L${x(0).toFixed(1)},${alto} Z`;
  return (
    <svg viewBox={`0 0 ${WIDTH} ${alto}`} className="h-12 w-full" preserveAspectRatio="none" aria-hidden="true">
      {marcas.map((marca) => (
        <line key={`${marca.color}-${marca.valor}`} x1={PAD} x2={WIDTH - PAD} y1={y(marca.valor)} y2={y(marca.valor)} stroke={marca.color} strokeDasharray="3 3" strokeWidth="1" />
      ))}
      <path d={area} fill={color} opacity="0.12" />
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      <circle cx={x(valores.length - 1)} cy={y(valores[valores.length - 1])} r="2.5" fill={color} />
    </svg>
  );
}
