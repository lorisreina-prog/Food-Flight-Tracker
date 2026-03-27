import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "./api";
import type { ActiveRecall, BatchListItem } from "./types";
import { formatDate } from "./types";
import BatchList from "./BatchList";
import ComplaintList from "./ComplaintList";
import Leaderboard from "./Leaderboard";

type Tab = "overview" | "complaints" | "leaderboard";

function StatsBar({ recalls, batches }: { recalls: ActiveRecall[]; batches: BatchListItem[] }) {
  const avg = batches.length
    ? Math.round(batches.reduce((s, b) => s + (b.trust_score ?? 0), 0) / batches.length)
    : null;
  return (
    <div className="admin-stats">
      <div className="admin-stat-card">
        <div className="admin-stat-label">Produkte</div>
        <div className="admin-stat-value">{batches.length}</div>
        <div className="admin-stat-sub">Chargen im System</div>
      </div>
      <div className="admin-stat-card">
        <div className="admin-stat-label">Aktive Rückrufe</div>
        <div className="admin-stat-value" style={{ color: recalls.length ? "#DC2626" : "#059669" }}>
          {recalls.length}
        </div>
        <div className="admin-stat-sub">{recalls.length ? "Sofortige Massnahme nötig" : "Alles in Ordnung"}</div>
      </div>
      <div className="admin-stat-card">
        <div className="admin-stat-label">Ø Vertrauensscore</div>
        <div className="admin-stat-value" style={{ color: avg == null ? "#94A3B8" : avg < 50 ? "#DC2626" : avg < 75 ? "#D97706" : "#059669" }}>
          {avg ?? "—"}
        </div>
        <div className="admin-stat-sub">Durchschnitt aller Chargen</div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [recalls, setRecalls] = useState<ActiveRecall[]>([]);
  const [batches, setBatches] = useState<BatchListItem[]>([]);

  useEffect(() => {
    api.getActiveRecalls().then(setRecalls).catch(() => {});
    api.getBatches().then(setBatches).catch(() => {});
  }, []);

  const resolve = async (recallId: number) => {
    await api.resolveRecall(recallId);
    setRecalls((prev) => prev.filter((r) => r.recall_id !== recallId));
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-top">
          <div className="admin-logo">
            <div className="admin-logo-mark">🍎</div>
            Food Flight
          </div>
          <div className="admin-tagline">Tracker Admin</div>
        </div>

        <nav className="admin-nav">
          <button
            className={`admin-nav-item ${tab === "overview" ? "admin-nav-item--active" : ""}`}
            onClick={() => setTab("overview")}
          >
            <span className="admin-nav-icon">📊</span> Übersicht
          </button>
          <button
            className={`admin-nav-item ${tab === "complaints" ? "admin-nav-item--active" : ""}`}
            onClick={() => setTab("complaints")}
          >
            <span className="admin-nav-icon">📋</span> Beanstandungen
          </button>
          <button
            className={`admin-nav-item ${tab === "leaderboard" ? "admin-nav-item--active" : ""}`}
            onClick={() => setTab("leaderboard")}
          >
            <span className="admin-nav-icon">🏆</span> Leaderboard
          </button>
        </nav>

        <Link to="/scanner" className="admin-nav-scan">
          <span>📷</span> QR scannen
        </Link>
      </aside>

      <main className="admin-main">
        {tab === "overview" && (
          <>
            <StatsBar recalls={recalls} batches={batches} />

            {recalls.length > 0 ? (
              <div className="recall-strip">
                <div className="recall-strip-header">
                  <span className="recall-strip-blink" />
                  ⚠️ Aktive Rückrufe — {recalls.length} Charge{recalls.length > 1 ? "n" : ""} betroffen
                </div>
                {recalls.map((r) => (
                  <div key={r.recall_id} className="recall-strip-item">
                    <div className="recall-strip-top">
                      <span className="recall-strip-product">{r.product_name}</span>
                      <span className="recall-strip-severity">{r.severity.toUpperCase()}</span>
                    </div>
                    <div className="recall-strip-reason">
                      {r.reason} — {r.issued_by}, {formatDate(r.issued_at)}
                    </div>
                    <button className="btn-sm btn-outline" onClick={() => resolve(r.recall_id)}>
                      ✓ Auflösen
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="recall-strip-ok">
                ✅ Keine aktiven Rückrufe — alle Chargen unbedenklich
              </div>
            )}

            <h2 className="admin-section-title">Alle Chargen</h2>
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
