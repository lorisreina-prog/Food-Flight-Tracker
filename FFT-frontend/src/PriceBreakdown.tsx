import { useEffect, useState } from "react";
import { api } from "./api";
import type { PriceBreakdownItem } from "./types";

interface Props {
  batchId: number;
}

const STAGE_COLOR: Record<string, string> = {
  farm: "#16A34A",
  processing: "#2563EB",
  transport: "#D97706",
  retail: "#9333ea",
};

export default function PriceBreakdown({ batchId }: Props) {
  const [items, setItems] = useState<PriceBreakdownItem[] | null>(null);

  useEffect(() => {
    api.getPriceBreakdown(batchId).then(setItems).catch(() => {});
  }, [batchId]);

  if (!items || !items.length) return null;

  const total = items.reduce((s, i) => s + i.cost_chf, 0);

  return (
    <div className="card">
      <h3 className="card-title">Preisaufschlüsselung</h3>
      <div className="price-bar">
        {items.map((item) => (
          <div key={item.stage}
            style={{
              width: `${(item.cost_chf / total) * 100}%`,
              background: STAGE_COLOR[item.stage] ?? "#6b7280",
              height: "100%",
            }}
            title={`${item.stage}: CHF ${item.cost_chf.toFixed(2)}`}
          />
        ))}
      </div>
      <div className="price-legend">
        {items.map((item) => (
          <div key={item.stage} className="price-legend-item">
            <span className="price-dot" style={{ background: STAGE_COLOR[item.stage] ?? "#6b7280" }} />
            <span className="price-stage">{item.stage}</span>
            <span className="price-cost">CHF {item.cost_chf.toFixed(2)}</span>
            <span className="price-margin">+{item.margin_pct.toFixed(0)}%</span>
          </div>
        ))}
        <div className="price-legend-item price-total">
          <span style={{ flex: 1 }}>Total</span>
          <span>CHF {total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
