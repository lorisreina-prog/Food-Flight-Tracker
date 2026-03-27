import type { RecallItem } from "./types";
import { formatDate } from "./types";

interface Props {
  status: string;
  recalls: RecallItem[];
}

export default function RecallBanner({ status, recalls }: Props) {
  if (status === "none") return null;

  const active = recalls.filter((r) => !r.resolved_at);

  if (status === "critical") {
    return (
      <div className="recall-critical-screen">
        <div className="recall-critical-inner">
          <div className="recall-icon">⚠️</div>
          <h1>RÜCKRUF</h1>
          <p className="recall-critical-title">Kritischer Produktrückruf</p>
          {active.map((r) => (
            <div key={r.recall_id} className="recall-reason-box">
              <p>{r.reason}</p>
              <p className="recall-meta">Ausgegeben von {r.issued_by} am {formatDate(r.issued_at)}</p>
            </div>
          ))}
          <p className="recall-scroll-hint">Weiter scrollen für Details ↓</p>
        </div>
      </div>
    );
  }

  const bg = status === "warning" ? "#D97706" : "#2563EB";

  return (
    <div style={{ background: bg, color: "#fff", padding: "12px 16px" }}>
      <strong>{status === "warning" ? "⚠️ Warnung" : "ℹ️ Information"}</strong>
      {active.map((r) => (
        <div key={r.recall_id} style={{ marginTop: 4, fontSize: 14 }}>
          {r.reason} — {r.issued_by}, {formatDate(r.issued_at)}
        </div>
      ))}
    </div>
  );
}
