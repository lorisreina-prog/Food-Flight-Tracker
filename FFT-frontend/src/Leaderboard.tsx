import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "./api";
import type { LeaderboardItem, BatchListItem } from "./types";

const NUTRI_COLOR: Record<string, string> = {
  A: "#16A34A", B: "#65A30D", C: "#EAB308", D: "#F97316", E: "#DC2626",
};

const TRUST_COLOR = (score: number) =>
  score < 40 ? "#DC2626" : score <= 70 ? "#D97706" : "#16A34A";

export default function Leaderboard() {
  const [items, setItems] = useState<LeaderboardItem[]>([]);
  const [batches, setBatches] = useState<BatchListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getLeaderboard(), api.getBatches()])
      .then(([lb, bl]) => { setItems(lb); setBatches(bl); })
      .finally(() => setLoading(false));
  }, []);

  const qrFor = (batchId: number) =>
    batches.find((b) => b.batch_id === batchId)?.qr_code ?? String(batchId);

  if (loading) return <div className="skeleton-card" style={{ height: 240 }} />;

  return (
    <div className="leaderboard">
      {items.map((item, i) => {
        const isFirst = i === 0;
        return (
          <Link
            key={item.batch_id}
            to={`/scan/${qrFor(item.batch_id)}`}
            className={`leaderboard-item ${isFirst ? "leaderboard-item--gold" : ""}`}
          >
            <span className="lb-rank">{i < 3 ? ["🥇", "🥈", "🥉"][i] : `#${i + 1}`}</span>

            <div className="lb-main">
              <span className="lb-name">{item.product_name}</span>
              <span className="lb-origin">{item.origin_country}</span>
            </div>

            <div className="lb-right">
              {item.nutri_grade && (
                <span
                  className="badge badge-sm"
                  style={{ background: NUTRI_COLOR[item.nutri_grade] ?? "#6b7280" }}
                >
                  {item.nutri_grade}
                </span>
              )}
              <div className="lb-score-wrap">
                <div className="lb-score-bar-track">
                  <div
                    className="lb-score-bar-fill"
                    style={{
                      width: `${item.trust_score}%`,
                      background: TRUST_COLOR(item.trust_score),
                    }}
                  />
                </div>
                <span className="lb-score-num" style={{ color: TRUST_COLOR(item.trust_score) }}>
                  {item.trust_score}
                </span>
              </div>
            </div>
          </Link>
        );
      })}
      {!items.length && <p className="empty-state">Keine Einträge vorhanden.</p>}
    </div>
  );
}
