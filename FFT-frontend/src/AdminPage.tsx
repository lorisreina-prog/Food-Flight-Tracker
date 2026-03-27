import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "./api";
import { logout, getSession } from "./auth";
import Logo from "./Logo";
import type { ActiveRecall, BatchListItem } from "./types";
import { formatDate } from "./types";
import BatchList from "./BatchList";
import ComplaintList from "./ComplaintList";
import Leaderboard from "./Leaderboard";

type Tab = "overview" | "complaints" | "leaderboard";

const IconGrid = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
  </svg>
);

const IconClipboard = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    <line x1="9" y1="12" x2="15" y2="12" /><line x1="9" y1="16" x2="15" y2="16" />
  </svg>
);

const IconTrophy = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="8 6 4 6 4 12 8 12" />
    <polyline points="16 6 20 6 20 12 16 12" />
    <path d="M8 6h8v7a4 4 0 0 1-8 0V6Z" />
    <line x1="12" y1="17" x2="12" y2="21" />
    <line x1="9" y1="21" x2="15" y2="21" />
  </svg>
);

const IconCamera = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

const IconAlertTriangle = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const IconCheckCircle = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const IconLogOut = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

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
  const navigate = useNavigate();

  const fetchData = () => {
    api.getActiveRecalls().then(setRecalls).catch(() => {});
    api.getBatches().then(setBatches).catch(() => {});
  };

  useEffect(() => {
    fetchData();
    const onFocus = () => fetchData();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const resolve = async (recallId: number) => {
    await api.resolveRecall(recallId);
    setRecalls((prev) => prev.filter((r) => r.recall_id !== recallId));
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const authUser = getSession()?.email ?? "Admin";

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-top">
          <div className="admin-logo">
            <Logo size={30} />
            FoodTrace
          </div>
          <div className="admin-tagline">{authUser}</div>
        </div>

        <nav className="admin-nav">
          <button
            className={`admin-nav-item ${tab === "overview" ? "admin-nav-item--active" : ""}`}
            onClick={() => setTab("overview")}
          >
            <span className="admin-nav-icon"><IconGrid /></span>
            Übersicht
          </button>
          <button
            className={`admin-nav-item ${tab === "complaints" ? "admin-nav-item--active" : ""}`}
            onClick={() => setTab("complaints")}
          >
            <span className="admin-nav-icon"><IconClipboard /></span>
            Beanstandungen
          </button>
          <button
            className={`admin-nav-item ${tab === "leaderboard" ? "admin-nav-item--active" : ""}`}
            onClick={() => setTab("leaderboard")}
          >
            <span className="admin-nav-icon"><IconTrophy /></span>
            Leaderboard
          </button>
        </nav>

        <div className="admin-sidebar-bottom">
          <Link to="/scanner" className="admin-nav-scan">
            <IconCamera />
            Produkt scannen
          </Link>
          <button className="admin-logout-btn" onClick={handleLogout}>
            <IconLogOut />
            Abmelden
          </button>
        </div>
      </aside>

      <main className="admin-main">
        {tab === "overview" && (
          <>
            <StatsBar recalls={recalls} batches={batches} />

            {recalls.length > 0 ? (
              <div className="recall-strip">
                <div className="recall-strip-header">
                  <span className="recall-strip-blink" />
                  <IconAlertTriangle />
                  Aktive Rückrufe — {recalls.length} Charge{recalls.length > 1 ? "n" : ""} betroffen
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
                      Auflösen
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="recall-strip-ok">
                <IconCheckCircle />
                Keine aktiven Rückrufe — alle Chargen unbedenklich
              </div>
            )}

            <h2 className="admin-section-title">Alle Chargen</h2>
            <BatchList onRefresh={fetchData} />
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
