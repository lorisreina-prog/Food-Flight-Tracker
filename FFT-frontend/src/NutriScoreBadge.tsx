import { useEffect, useState } from "react";
import { api } from "./api";
import type { NutriScoreResponse } from "./types";

interface Props {
  batchId: number;
  grade: string;
}

const GRADE_COLOR: Record<string, string> = {
  A: "#16A34A",
  B: "#65A30D",
  C: "#EAB308",
  D: "#F97316",
  E: "#DC2626",
};

export default function NutriScoreBadge({ batchId, grade }: Props) {
  const [data, setData] = useState<NutriScoreResponse | null>(null);

  useEffect(() => {
    api.getNutriScore(batchId).then(setData).catch(() => {});
  }, [batchId]);

  const color = GRADE_COLOR[grade] ?? "#6b7280";

  return (
    <div className="card">
      <h3 className="card-title">Nutri-Score</h3>
      <div className="nutri-header">
        {["A", "B", "C", "D", "E"].map((g) => (
          <div key={g} className={`nutri-grade-box ${g === grade ? "nutri-grade-box--active" : ""}`}
            style={{ background: g === grade ? GRADE_COLOR[g] : "#e5e7eb", color: g === grade ? "#fff" : "#9ca3af" }}>
            {g}
          </div>
        ))}
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
