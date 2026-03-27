import type { RecallItem } from "./types";
import { formatDate } from "./types";

interface Props {
  status: string;
  recalls: RecallItem[];
}

const SvgAlertTriangle = ({ size = 60 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const SvgBan = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
  </svg>
);

const SvgInfo = ({ size = 15 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const SvgChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

export default function RecallBanner({ status, recalls }: Props) {
  if (status === "none") return null;

  const active = recalls.filter((r) => !r.resolved_at);

  if (status === "critical") {
    return (
      <div className="recall-critical-screen">
        <div className="recall-critical-inner">
          <div className="recall-icon"><SvgAlertTriangle size={60} /></div>
          <h1>RÜCKRUF</h1>
          <div className="recall-not-consume">
            <SvgBan size={18} />
            Nicht konsumieren
          </div>
          <p className="recall-critical-title">Kritischer Produktrückruf — Sofort stoppen</p>
          {active.map((r) => (
            <div key={r.recall_id} className="recall-reason-box">
              <p>{r.reason}</p>
              <p className="recall-meta">Ausgegeben von {r.issued_by} am {formatDate(r.issued_at)}</p>
            </div>
          ))}
          <p className="recall-scroll-hint" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            Weiter scrollen für Details <SvgChevronDown />
          </p>
        </div>
      </div>
    );
  }

  const isWarning = status === "warning";
  const bg = isWarning ? "#D97706" : "#2563EB";

  return (
    <div style={{ background: bg, color: "#fff", padding: "12px 16px", borderRadius: 10, marginBottom: 12, display: "flex", flexDirection: "column", gap: 4 }}>
      <strong style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {isWarning ? <SvgAlertTriangle size={15} /> : <SvgInfo size={15} />}
        {isWarning ? "Warnung" : "Information"}
      </strong>
      {active.map((r) => (
        <div key={r.recall_id} style={{ fontSize: 14 }}>
          {r.reason} — {r.issued_by}, {formatDate(r.issued_at)}
        </div>
      ))}
    </div>
  );
}
