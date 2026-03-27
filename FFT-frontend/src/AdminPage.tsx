import { useEffect, useState } from "react";
import { api } from "./api";
import type { ActiveRecall } from "./types";
import { formatDate } from "./types";
import BatchList from "./BatchList";
import ComplaintList from "./ComplaintList";
import Leaderboard from "./Leaderboard";

type Tab = "overview" | "complaints" | "leaderboard";

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [recalls, setRecalls] = useState<ActiveRecall[]>([]);

  useEffect(() => {
    api.getActiveRecalls().then(setRecalls).catch(() => {});
  }, []);

  const resolve = async (recallId: number) => {
    await api.resolveRecall(recallId);
    setRecalls((prev) => prev.filter((r) => r.recall_id !== recallId));
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-logo">FFT Admin</div>
        <nav className="admin-nav">
          <button className={`admin-nav-item ${tab === "overview" ? "admin-nav-item--active" : ""}`}
            onClick={() => setTab("overview")}>
            Übersicht
          </button>
          <button className={`admin-nav-item ${tab === "complaints" ? "admin-nav-item--active" : ""}`}
            onClick={() => setTab("complaints")}>
            Beanstandungen
          </button>
          <button className={`admin-nav-item ${tab === "leaderboard" ? "admin-nav-item--active" : ""}`}
            onClick={() => setTab("leaderboard")}>
            Leaderboard
          </button>
        </nav>
      </aside>

      <main className="admin-main">
        {tab === "overview" && (
          <>
            {recalls.length > 0 ? (
              <div className="recall-strip">
                <div className="recall-strip-header">
                  <span className="recall-strip-blink" />
                  ⚠️ Aktive Rückrufe ({recalls.length})
                </div>
                {recalls.map((r) => (
                  <div key={r.recall_id} className="recall-strip-item">
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span className="recall-strip-product">{r.product_name}</span>
                      <span className="recall-strip-severity">{r.severity.toUpperCase()}</span>
                    </div>
                    <div className="recall-strip-reason">{r.reason} — {r.issued_by}, {formatDate(r.issued_at)}</div>
                    <button className="btn-sm btn-outline" onClick={() => resolve(r.recall_id)}>
                      Auflösen
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="recall-strip" style={{ background: "linear-gradient(135deg,#16A34A,#15803d)", boxShadow: "0 4px 16px rgba(22,163,74,.2)", borderLeft: "5px solid #86efac" }}>
                <div className="recall-strip-header">✅ Keine aktiven Rückrufe</div>
              </div>
            )}
            <h2 className="admin-section-title">Alle Batches</h2>
            <BatchList />
          </>
        )}
        {tab === "complaints" && (
          <>
            <h2 className="admin-section-title">Beanstandungen</h2>
            <ComplaintList />
          </>
        )}
        {tab === "leaderboard" && (
          <>
            <h2 className="admin-section-title">Leaderboard</h2>
            <Leaderboard />
          </>
        )}
      </main>
    </div>
  );
}
