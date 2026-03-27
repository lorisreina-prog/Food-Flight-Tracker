import { useEffect, useState } from "react";
import { api } from "./api";
import type { ComplaintListItem } from "./types";
import { formatDate } from "./types";

const STATUS_COLOR: Record<string, string> = {
  open: "#DC2626",
  reviewed: "#D97706",
  resolved: "#16A34A",
};

const NEXT_STATUS: Record<string, string[]> = {
  open: ["reviewed", "resolved"],
  reviewed: ["resolved"],
  resolved: [],
};

const STATUS_LABEL: Record<string, string> = {
  open: "Offen",
  reviewed: "Geprüft",
  resolved: "Erledigt",
  reviewed_action: "→ Geprüft",
  resolved_action: "→ Erledigt",
};

export default function ComplaintList() {
  const [items, setItems] = useState<ComplaintListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getComplaints().then(setItems).finally(() => setLoading(false));
  }, []);

  const transition = async (id: number, status: string) => {
    await api.updateComplaintStatus(id, status);
    setItems((prev) => prev.map((c) => c.complaint_id === id ? { ...c, status } : c));
  };

  if (loading) return <div className="skeleton-card" style={{ height: 160 }} />;

  return (
    <div className="complaint-list">
      {items.map((c) => (
        <div key={c.complaint_id} className="complaint-list-item">
          <div className="complaint-header">
            <span className="complaint-product">{c.product_name}</span>
            <span className="complaint-status-badge" style={{ background: STATUS_COLOR[c.status] ?? "#6b7280" }}>
              {STATUS_LABEL[c.status] ?? c.status}
            </span>
          </div>
          <div className="complaint-meta">
            {c.reporter_name} · {c.category} · {formatDate(c.submitted_at)}
          </div>
          <div className="complaint-actions">
            {NEXT_STATUS[c.status]?.map((s) => (
              <button key={s} className="btn-sm" onClick={() => transition(c.complaint_id, s)}>
                → {STATUS_LABEL[s] ?? s}
              </button>
            ))}
          </div>
        </div>
      ))}
      {!items.length && <p className="empty-state">Keine Beanstandungen vorhanden.</p>}
    </div>
  );
}
