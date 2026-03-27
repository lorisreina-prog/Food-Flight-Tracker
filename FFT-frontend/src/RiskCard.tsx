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

const R = 44;
const CIRCUMFERENCE = 2 * Math.PI * R;

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

  if (loading) return <div className="card skeleton-card" style={{ height: 160 }} />;

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
      <h3 className="card-title">KI-Risikoanalyse</h3>

      <div className="risk-gauge-row">
        <div className="risk-gauge">
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r={R} fill="none" stroke="#e5e7eb" strokeWidth="11" />
            <circle
              cx="60" cy="60" r={R}
              fill="none"
              stroke={color}
              strokeWidth="11"
              strokeDasharray={`${dash} ${CIRCUMFERENCE}`}
              strokeLinecap="round"
              transform="rotate(-90 60 60)"
              style={{ transition: "stroke-dasharray .7s ease" }}
            />
            <text x="60" y="55" textAnchor="middle" fontSize="26" fontWeight="900" fill={color}>
              {data.risk_score}
            </text>
            <text x="60" y="70" textAnchor="middle" fontSize="11" fill="#94a3b8">
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
          {data.risk_factors.length > 0 && (
            <div className="risk-chips">
              {data.risk_factors.map((f, i) => (
                <span key={i} className="risk-chip" style={{ borderColor: color, color }}>
                  {f}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <p className="risk-explanation">💡 {data.ai_explanation}</p>
    </div>
  );
}
