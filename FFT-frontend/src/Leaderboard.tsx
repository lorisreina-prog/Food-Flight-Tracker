import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "./api";
import type { LeaderboardItem, BatchListItem } from "./types";
import Spinner from "./Spinner";

const NUTRI_COLOR: Record<string, string> = {
  A: "#16A34A", B: "#65A30D", C: "#EAB308", D: "#F97316", E: "#DC2626",
};

const TRUST_COLOR = (score: number) =>
  score < 40 ? "#DC2626" : score <= 70 ? "#D97706" : "#16A34A";

const MEDAL = ["🥇", "🥈", "🥉"];

function RankBadge({ rank }: { rank: number }) {
  const gold = rank === 1;
  const silver = rank === 2;
  const bronze = rank === 3;
  const podium = gold || silver || bronze;

  return (
    <span
      style={{
        width: 32, height: 32,
        borderRadius: "50%",
        background: gold
          ? "linear-gradient(135deg,#FCD34D,#F59E0B)"
          : silver
          ? "linear-gradient(135deg,#E2E8F0,#94A3B8)"
          : bronze
          ? "linear-gradient(135deg,#D97706,#92400E)"
          : "var(--surface-3)",
        color: podium ? "#fff" : "var(--tx-2)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: podium ? 12 : 11,
        fontWeight: 800,
        flexShrink: 0,
        boxShadow: podium ? "0 2px 6px rgba(0,0,0,.25)" : "none",
        letterSpacing: "-.01em",
      }}
    >
      {rank}
    </span>
  );
}

export default function Leaderboard() {
  const [items, setItems] = useState<LeaderboardItem[]>([]);
  const [batches, setBatches] = useState<BatchListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    Promise.all([api.getLeaderboard(), api.getBatches()])
      .then(([lb, bl]) => { setItems(lb); setBatches(bl); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading && items.length) {
      const t = setTimeout(() => setAnimated(true), 80);
      return () => clearTimeout(t);
    }
  }, [loading, items.length]);

  const qrFor = (batchId: number) =>
    batches.find((b) => b.batch_id === batchId)?.qr_code ?? String(batchId);

  if (loading) return <Spinner />;

  if (!items.length) {
    return (
      <div className="empty-state">
        <span className="empty-state-text">Noch keine Einträge im Leaderboard.</span>
      </div>
    );
  }

  const maxScore = Math.max(...items.map((it) => it.trust_score), 1);

  return (
    <div className="leaderboard">
      <div className="lb-header-row">
        <span className="lb-header-label">Produkt</span>
        <span className="lb-header-label lb-header-score">Trust Score</span>
      </div>
      {items.map((item, i) => {
        const rank = i + 1;
        const isPodium = rank <= 3;
        const itemClass = `leaderboard-item${rank === 1 ? " leaderboard-item--gold" : rank === 2 ? " leaderboard-item--silver" : rank === 3 ? " leaderboard-item--bronze" : ""}`;
        const trustColor = TRUST_COLOR(item.trust_score);
        return (
          <Link
            key={item.batch_id}
            to={`/scan/${qrFor(item.batch_id)}`}
            className={itemClass}
          >
            <div className="lb-rank-col">
              <RankBadge rank={rank} />
              {isPodium && <span className="lb-medal">{MEDAL[i]}</span>}
            </div>

            <div className="lb-main">
              <div className="lb-name-row">
                <span className="lb-name">{item.product_name}</span>
                {item.nutri_grade && (
                  <span
                    className="badge badge-sm lb-nutri"
                    style={{ background: NUTRI_COLOR[item.nutri_grade] ?? "#6b7280" }}
                  >
                    {item.nutri_grade}
                  </span>
                )}
              </div>
              <span className="lb-origin">{item.origin_country}</span>
            </div>

            <div className="lb-right">
              <div className="lb-score-wrap">
                <div className="lb-score-bar-track">
                  <div
                    className="lb-score-bar-fill"
                    style={{
                      width: animated ? `${(item.trust_score / maxScore) * 100}%` : "0%",
                      background: trustColor,
                    }}
                  />
                </div>
                <span className="lb-score-num" style={{ color: trustColor }}>
                  {item.trust_score}
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
