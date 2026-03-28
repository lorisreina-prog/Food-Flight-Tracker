import { useEffect, useState } from "react";
import { api } from "./api";
import type { ColdChainResponse, ColdChainLogEntry } from "./types";
import Spinner from "./Spinner";

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

const SvgCheck = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const SvgAlert = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

export default function ColdChainChart({ batchId }: Props) {
  const [data, setData] = useState<ColdChainResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getColdChain(batchId).then(setData).catch(() => {}).finally(() => setLoading(false));
  }, [batchId]);

  if (loading) return <div className="card"><Spinner /></div>;
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

  const ok = data.cold_chain_ok;

  return (
    <div className="card">
      <h3 className="card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
        Kühlkette
        <span style={{
          fontWeight: 700, fontSize: 11, padding: "2px 8px", borderRadius: 999,
          background: ok ? "var(--green-lt)" : "var(--red-lt)",
          color: ok ? "var(--green)" : "var(--red)",
          textTransform: "none", letterSpacing: 0,
          display: "inline-flex", alignItems: "center", gap: 4,
        }}>
          {ok ? <SvgCheck /> : <SvgAlert />}
          {ok ? "OK" : `${data.breaches} Verstoss`}
        </span>
      </h3>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
        <rect x={PAD.left} y={bandTop} width={W - PAD.left - PAD.right}
          height={bandBot - bandTop} fill="#D1FAE5" opacity={0.7} rx={4} />
        <line x1={PAD.left} y1={bandTop} x2={W - PAD.right} y2={bandTop}
          stroke="#059669" strokeWidth="1" strokeDasharray="4 3" opacity={0.5} />
        <line x1={PAD.left} y1={bandBot} x2={W - PAD.right} y2={bandBot}
          stroke="#059669" strokeWidth="1" strokeDasharray="4 3" opacity={0.5} />
        <text x={PAD.left - 4} y={bandTop + 4} fontSize="9" fill="#059669" textAnchor="end">{allMax}°</text>
        <text x={PAD.left - 4} y={bandBot} fontSize="9" fill="#059669" textAnchor="end">{allMin}°</text>
        <polyline points={points} fill="none" stroke="#4F46E5" strokeWidth="2.5"
          strokeLinejoin="round" strokeLinecap="round" />
        {logs.map((l, i) => (
          <circle key={i}
            cx={scaleX(i, logs.length)} cy={scaleY(l.temp_celsius, yMin, yMax)}
            r={l.within_range ? 3.5 : 5.5}
            fill={l.within_range ? "#4F46E5" : "#DC2626"}
            stroke="#fff" strokeWidth={1.5}
          />
        ))}
      </svg>
    </div>
  );
}
