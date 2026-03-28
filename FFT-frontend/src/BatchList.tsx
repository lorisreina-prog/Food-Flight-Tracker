import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "./api";
import type { BatchListItem } from "./types";
import StatusBadge from "./StatusBadge";
import Spinner from "./Spinner";

const NUTRI_COLOR: Record<string, string> = {
  A: "#16A34A", B: "#65A30D", C: "#EAB308", D: "#F97316", E: "#DC2626",
};

const TRUST_COLOR = (score: number) =>
  score < 40 ? "#DC2626" : score <= 70 ? "#D97706" : "#16A34A";

export default function BatchList() {
  const [batches, setBatches] = useState<BatchListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getBatches().then(setBatches).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="batch-list">
      {batches.map((b) => (
        <Link key={b.batch_id} to={`/scan/${b.qr_code}`} className="batch-list-item">
          <div className="batch-list-main">
            <span className="batch-name">{b.product_name}</span>
            <span className="batch-origin">{b.origin_country}</span>
          </div>
          <div className="batch-list-badges">
            {b.recall_status !== "none" && <StatusBadge status={b.recall_status} size="sm" />}
            {b.nutri_grade && (
              <span className="badge badge-sm" style={{ background: NUTRI_COLOR[b.nutri_grade] ?? "#6b7280" }}>
                {b.nutri_grade}
              </span>
            )}
            {b.trust_score != null && (
              <span className="badge badge-sm" style={{ background: TRUST_COLOR(b.trust_score) }}>
                {b.trust_score}
              </span>
            )}
          </div>
        </Link>
      ))}
      {!batches.length && <p className="empty-state">Keine Batches vorhanden.</p>}
    </div>
  );
}
