import { useEffect, useState } from "react";
import { api } from "./api";
import type { EcoFootprintResponse } from "./types";

interface Props {
  batchId: number;
}

export default function EcoFootprint({ batchId }: Props) {
  const [data, setData] = useState<EcoFootprintResponse | null>(null);

  useEffect(() => {
    api.getEcoFootprint(batchId).then(setData).catch(() => {});
  }, [batchId]);

  if (!data) return null;

  return (
    <div className="card">
      <h3 className="card-title">Ökologischer Fussabdruck</h3>
      <div className="eco-grid">
        <div className="eco-item">
          <span className="eco-icon">🌍</span>
          <span className="eco-val">{data.co2_total_kg.toFixed(2)} kg</span>
          <span className="eco-label">CO₂</span>
        </div>
        <div className="eco-item">
          <span className="eco-icon">💧</span>
          <span className="eco-val">{data.water_liters.toFixed(0)} L</span>
          <span className="eco-label">Wasser</span>
        </div>
        <div className="eco-item">
          <span className="eco-icon">🌱</span>
          <span className="eco-val">{data.land_sqm.toFixed(0)} m²</span>
          <span className="eco-label">Land</span>
        </div>
        <div className="eco-item">
          <span className="eco-icon">🚚</span>
          <span className="eco-val">{data.transport_km} km</span>
          <span className="eco-label">Transport</span>
        </div>
      </div>
    </div>
  );
}
