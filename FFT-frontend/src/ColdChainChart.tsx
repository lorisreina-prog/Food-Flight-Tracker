import { useEffect, useState } from "react";
import { api } from "./api";
import type { ColdChainResponse, ColdChainLogEntry } from "./types";

interface Props {
  batchId: number;
}

const W = 320;
const H = 140;
const PAD = { top: 10, right: 16, bottom: 24, left: 36 };

function scaleX(i: number, total: number): number {
  return PAD.left + (i / Math.max(total - 1, 1)) * (W - PAD.left - PAD.right);
}

function scaleY(val: number, min: number, max: number): number {
  const range = max - min || 1;
  return H - PAD.bottom - ((val - min) / range) * (H - PAD.top - PAD.bottom);
}

export default function ColdChainChart({ batchId }: Props) {
  const [data, setData] = useState<ColdChainResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getColdChain(batchId).then(setData).catch(() => {}).finally(() => setLoading(false));
  }, [batchId]);

  if (loading) return <div className="card skeleton-card" style={{ height: 80 }} />;
  if (!data || !data.logs.length) return null;

  const logs: ColdChainLogEntry[] = data.logs;
  const temps = logs.map((l) => l.temp_celsius);
  const allMin = logs[0].min_temp;
  const allMax = logs[0].max_temp;
  const yMin = Math.min(...temps, allMin) - 1;
  const yMax = Math.max(...temps, allMax) + 1;

  const bandTop = scaleY(allMax, yMin, yMax);
  const bandBot = scaleY(allMin, yMin, yMax);

  const points = logs.map((l, i) => `${scaleX(i, logs.length)},${scaleY(l.temp_celsius, yMin, yMax)}`).join(" ");

  return (
    <div className="card">
      <h3 className="card-title">Kühlkette {data.cold_chain_ok ? "✅" : `⚠️ ${data.breaches} Verstoss`}</h3>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
        <rect x={PAD.left} y={bandTop} width={W - PAD.left - PAD.right} height={bandBot - bandTop}
          fill="#dcfce7" opacity={0.6} />
        <polyline points={points} fill="none" stroke="#2563EB" strokeWidth="2" strokeLinejoin="round" />
        {logs.map((l, i) => (
          !l.within_range ? (
            <circle key={i} cx={scaleX(i, logs.length)} cy={scaleY(l.temp_celsius, yMin, yMax)}
              r={5} fill="#DC2626" />
          ) : (
            <circle key={i} cx={scaleX(i, logs.length)} cy={scaleY(l.temp_celsius, yMin, yMax)}
              r={3} fill="#2563EB" />
          )
        ))}
        <line x1={PAD.left} y1={bandTop} x2={PAD.left} y2={bandBot} stroke="#16A34A" strokeWidth="1" strokeDasharray="4 2" />
        <text x={PAD.left - 4} y={bandTop + 4} fontSize="9" fill="#16A34A" textAnchor="end">{allMax}°</text>
        <text x={PAD.left - 4} y={bandBot} fontSize="9" fill="#16A34A" textAnchor="end">{allMin}°</text>
      </svg>
    </div>
  );
}
