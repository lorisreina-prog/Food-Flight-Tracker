import type { JourneyEvent } from "./types";
import { formatDate } from "./types";

interface Props {
  events: JourneyEvent[];
}

const EVENT_ICON: Record<string, string> = {
  harvested: "🌾",
  planted: "🌱",
  processed: "🏭",
  stored: "📦",
  shipped: "🚚",
  transported: "🚚",
  arrived: "📍",
  sold: "🛒",
  recalled: "⚠️",
  checked: "✅",
  created: "📋",
};

function iconFor(eventType: string): string {
  return EVENT_ICON[eventType.toLowerCase()] ?? "📌";
}

export default function JourneyTimeline({ events }: Props) {
  if (!events.length) return null;

  const lastIdx = events.length - 1;

  return (
    <div className="card">
      <h3 className="card-title">Reiseverlauf</h3>
      <div className="timeline">
        {events.map((e, i) => {
          const isCurrent = i === lastIdx;
          const hasBreach = e.temp_celsius != null;
          return (
            <div key={e.event_id} className={`timeline-step ${isCurrent ? "timeline-step--current" : ""}`}>
              <div className="timeline-left">
                <div className={`timeline-dot ${isCurrent ? "timeline-dot--active" : ""} ${hasBreach && e.event_type !== "recalled" ? "timeline-dot--breach" : ""}`}>
                  {iconFor(e.event_type)}
                </div>
                {i < lastIdx && <div className="timeline-line" />}
              </div>
              <div className="timeline-content">
                <div className="timeline-event-type">
                  {e.event_type}
                  {isCurrent && (
                    <span style={{ marginLeft: 8, fontSize: 11, color: "#16A34A", fontWeight: 600 }}>
                      ● Aktuell
                    </span>
                  )}
                </div>
                {e.station_name && <div className="timeline-station">{e.station_name}</div>}
                {e.location && <div className="timeline-location">{e.location}</div>}
                <div className="timeline-time">{formatDate(e.timestamp)}</div>
                {e.temp_celsius != null && (
                  <div className="timeline-temp breach-dot">🌡️ {e.temp_celsius}°C</div>
                )}
                {e.notes && <div className="timeline-notes">{e.notes}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
