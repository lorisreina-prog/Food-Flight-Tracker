import { useEffect, useState } from "react";
import { api } from "./api";
import type { RiskResponse } from "./types";

interface Props {
  batchId: number;
}

const LEVEL_COLOR: Record<string, string> = {
  low: "#16A34A",
  medium: "#D97706",
  high: "#F97316",
  critical: "#DC2626",
};

const LEVEL_LABEL: Record<string, string> = {
  low: "Niedrig",
  medium: "Mittel",
  high: "Hoch",
  critical: "Kritisch",
};

const CIRCUMFERENCE = 2 * Math.PI * 32;

export default function RiskCard({ batchId }: Props) {
  const [data, setData] = useState<RiskResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    api.getRisk(batchId)
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [batchId]);

  if (loading) return <div className="card skeleton-card" style={{ height: 140 }} />;

  if (error) {
    return (
      <div className="card">
        <h3 className="card-title">Risikoanalyse</h3>
        <p className="risk-error">Risikoanalyse konnte nicht geladen werden.</p>
      </div>
    );
  }

  if (!data) return null;

  const color = LEVEL_COLOR[data.risk_level] ?? "#6b7280";
  const dash = (data.risk_score / 100) * CIRCUMFERENCE;

  return (
    <div className="card">
      <h3 className="card-title">Risikoanalyse</h3>

      <div className="risk-gauge-row">
        <div className="risk-gauge">
          <svg width="88" height="88" viewBox="0 0 88 88">
            <circle cx="44" cy="44" r="32" fill="none" stroke="#e5e7eb" strokeWidth="9" />
            <circle
              cx="44" cy="44" r="32"
              fill="none"
              stroke={color}
              strokeWidth="9"
              strokeDasharray={`${dash} ${CIRCUMFERENCE}`}
              strokeLinecap="round"
              transform="rotate(-90 44 44)"
              style={{ transition: "stroke-dasharray .6s ease" }}
            />
            <text x="44" y="40" textAnchor="middle" fontSize="18" fontWeight="800" fill={color}>
              {data.risk_score}
            </text>
            <text x="44" y="54" textAnchor="middle" fontSize="9" fill="#94a3b8">
              /100
            </text>
          </svg>
        </div>

        <div className="risk-info">
          <span className="risk-level-label" style={{ color }}>
            {LEVEL_LABEL[data.risk_level] ?? data.risk_level}
          </span>
          {data.shelf_life_days != null && (
            <p className="risk-shelf">
              Voraussichtliche Haltbarkeit: <strong>{data.shelf_life_days} Tage</strong>
            </p>
          )}
        </div>
      </div>

      {data.risk_factors.length > 0 && (
        <div className="risk-chips">
          {data.risk_factors.map((f, i) => (
            <span key={i} className="risk-chip" style={{ borderColor: color, color }}>
              {f}
            </span>
          ))}
        </div>
      )}

      <p className="risk-explanation">{data.ai_explanation}</p>
    </div>
  );
}
