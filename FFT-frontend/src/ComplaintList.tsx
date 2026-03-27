import { useEffect, useState } from "react";
import { api } from "./api";
import type { ComplaintListItem } from "./types";
import { formatDate } from "./types";

const STATUS_COLOR: Record<string, string> = {
  open: "#DC2626",
  reviewed: "#D97706",
  resolved: "#16A34A",
};

const STATUS_BG: Record<string, string> = {
  open: "#FEF2F2",
  reviewed: "#FFFBEB",
  resolved: "#F0FDF4",
};

const STATUS_BORDER: Record<string, string> = {
  open: "#FECACA",
  reviewed: "#FDE68A",
  resolved: "#BBF7D0",
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
};

const STATUS_ACTION_LABEL: Record<string, string> = {
  reviewed: "Als Geprüft markieren",
  resolved: "Als Erledigt markieren",
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
        <div
          key={c.complaint_id}
          className="complaint-list-item"
          style={{
            borderLeft: `4px solid ${STATUS_COLOR[c.status] ?? "#6b7280"}`,
          }}
        >
          <div className="complaint-header">
            <span className="complaint-product">{c.product_name}</span>
            <span
              className="complaint-status-badge"
              style={{
                background: STATUS_BG[c.status] ?? "#F3F4F6",
                color: STATUS_COLOR[c.status] ?? "#6b7280",
                border: `1px solid ${STATUS_BORDER[c.status] ?? "#E5E7EB"}`,
              }}
            >
              {STATUS_LABEL[c.status] ?? c.status}
            </span>
          </div>
          <div className="complaint-meta">
            {c.reporter_name} · {c.category} · {formatDate(c.submitted_at)}
          </div>
          <div className="complaint-actions">
            {NEXT_STATUS[c.status]?.map((s) => (
              <button
                key={s}
                className="complaint-action-btn"
                style={{ borderColor: STATUS_COLOR[s], color: STATUS_COLOR[s] }}
                onClick={() => transition(c.complaint_id, s)}
              >
                {STATUS_ACTION_LABEL[s] ?? s}
              </button>
            ))}
          </div>
        </div>
      ))}
      {!items.length && <p className="empty-state">Keine Beanstandungen vorhanden.</p>}
    </div>
  );
}
