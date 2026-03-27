import { useEffect, useState } from "react";
import { api } from "./api";
import type { NutriScoreResponse } from "./types";

interface Props {
  batchId: number;
  grade: string;
}

const GRADE_CONFIG: Record<string, { bg: string; faded: string }> = {
  A: { bg: "#059669", faded: "#ECFDF5" },
  B: { bg: "#65A30D", faded: "#F7FEE7" },
  C: { bg: "#D97706", faded: "#FFFBEB" },
  D: { bg: "#EA580C", faded: "#FFF7ED" },
  E: { bg: "#DC2626", faded: "#FEF2F2" },
};

export default function NutriScoreBadge({ batchId, grade }: Props) {
  const [data, setData] = useState<NutriScoreResponse | null>(null);

  useEffect(() => {
    api.getNutriScore(batchId).then(setData).catch(() => {});
  }, [batchId]);

  return (
    <div className="card">
      <h3 className="card-title">Nutri-Score</h3>
      <div style={{ display: "flex", gap: 5, marginBottom: 16 }}>
        {["A", "B", "C", "D", "E"].map((g) => {
          const cfg = GRADE_CONFIG[g] ?? { bg: "#94A3B8", faded: "#F1F5F9" };
          const active = g === grade;
          return (
            <div key={g} style={{
              width: active ? 44 : 36, height: active ? 44 : 36,
              borderRadius: active ? 10 : 8,
              background: active ? cfg.bg : cfg.faded,
              color: active ? "#fff" : cfg.bg,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 900, fontSize: active ? 20 : 15,
              transition: "all .15s",
              border: `2px solid ${active ? cfg.bg : "transparent"}`,
              boxShadow: active ? `0 4px 12px ${cfg.bg}40` : "none",
            }}>
              {g}
            </div>
          );
        })}
      </div>
      {data && (
        <table className="nutri-table">
          <tbody>
            <tr><td>Energie</td><td>{data.energy_kcal.toFixed(0)} kcal</td></tr>
            <tr><td>Fett</td><td>{data.fat_g.toFixed(1)} g</td></tr>
            <tr><td>Davon gesättigte FS</td><td>{data.saturated_fat_g.toFixed(1)} g</td></tr>
            <tr><td>Zucker</td><td>{data.sugar_g.toFixed(1)} g</td></tr>
            <tr><td>Salz</td><td>{data.salt_g.toFixed(2)} g</td></tr>
            <tr><td>Ballaststoffe</td><td>{data.fiber_g.toFixed(1)} g</td></tr>
            <tr><td>Protein</td><td>{data.protein_g.toFixed(1)} g</td></tr>
          </tbody>
        </table>
      )}
    </div>
  );
}
