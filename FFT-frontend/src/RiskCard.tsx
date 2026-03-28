import { useEffect, useState } from "react";
import { api } from "./api";
import type { RiskResponse } from "./types";
import Spinner from "./Spinner";

interface Props {
  batchId: number;
}

const LEVEL_COLOR: Record<string, string> = {
  low: "#059669",
  medium: "#D97706",
  high: "#EA580C",
  critical: "#DC2626",
};

const LEVEL_LABEL: Record<string, string> = {
  low: "Niedrig",
  medium: "Mittel",
  high: "Hoch",
  critical: "Kritisch",
};

const LEVEL_BG: Record<string, string> = {
  low: "#D1FAE5",
  medium: "#FEF3C7",
  high: "#FFEDD5",
  critical: "#FEE2E2",
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

  if (loading) return <div className="card"><Spinner /></div>;

  if (error) {
    return (
      <div className="card">
        <h3 className="card-title">KI-Risikoanalyse</h3>
        <p className="risk-error">Risikoanalyse konnte nicht geladen werden.</p>
      </div>
    );
  }

  if (!data) return null;

  const color = LEVEL_COLOR[data.risk_level] ?? "#6b7280";
  const bg = LEVEL_BG[data.risk_level] ?? "#F1F5F9";
  const dash = (data.risk_score / 100) * CIRCUMFERENCE;

  return (
    <div className="card">
      <h3 className="card-title">KI-Risikoanalyse</h3>

      <div className="risk-gauge-row">
        <div className="risk-gauge">
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r={R} fill="none" stroke="#E2E8F0" strokeWidth="11" />
            <circle
              cx="60" cy="60" r={R}
              fill="none" stroke={color} strokeWidth="11"
              strokeDasharray={`${dash} ${CIRCUMFERENCE}`}
              strokeLinecap="round"
              transform="rotate(-90 60 60)"
              style={{ transition: "stroke-dasharray .7s ease" }}
            />
            <text x="60" y="55" textAnchor="middle" fontSize="26" fontWeight="900" fill={color}>
              {data.risk_score}
            </text>
            <text x="60" y="70" textAnchor="middle" fontSize="11" fill="#94A3B8">
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
              Haltbarkeit: <strong>{data.shelf_life_days} Tage</strong>
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

      <div style={{ background: bg, borderRadius: "var(--radius-sm)", padding: "12px 14px" }}>
        <p className="risk-explanation" style={{ borderTop: "none", paddingTop: 0, marginTop: 0 }}>
          {data.ai_explanation}
        </p>
      </div>
    </div>
  );
}
