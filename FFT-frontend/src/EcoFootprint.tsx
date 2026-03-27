import { useEffect, useState } from "react";
import { api } from "./api";
import type { EcoFootprintResponse } from "./types";

interface Props {
  batchId: number;
}

const SvgGlobe = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const SvgDroplet = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
  </svg>
);

const SvgLeaf = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 8C8 10 5.9 16.17 3.82 19.25c1.01 1 2.05 1.17 3.25.79 2.18-.67 4.98-3.61 8.18-5.57" />
    <path d="M17 8a13 13 0 0 0-13 9" />
    <circle cx="17" cy="8" r="1" />
  </svg>
);

const SvgTruck = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13" />
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);

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
          <span className="eco-icon"><SvgGlobe /></span>
          <span className="eco-val">{data.co2_total_kg.toFixed(2)} kg</span>
          <span className="eco-label">CO₂</span>
        </div>
        <div className="eco-item">
          <span className="eco-icon"><SvgDroplet /></span>
          <span className="eco-val">{data.water_liters.toFixed(0)} L</span>
          <span className="eco-label">Wasser</span>
        </div>
        <div className="eco-item">
          <span className="eco-icon"><SvgLeaf /></span>
          <span className="eco-val">{data.land_sqm.toFixed(0)} m²</span>
          <span className="eco-label">Land</span>
        </div>
        <div className="eco-item">
          <span className="eco-icon"><SvgTruck /></span>
          <span className="eco-val">{data.transport_km} km</span>
          <span className="eco-label">Transport</span>
        </div>
      </div>
    </div>
  );
}
