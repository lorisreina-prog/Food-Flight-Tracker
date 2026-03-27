import type { JourneyEvent } from "./types";
import { formatDate } from "./types";

interface Props {
  events: JourneyEvent[];
}

const EVENT_ICON: Record<string, string> = {
  harvested: "🌾", planted: "🌱", processed: "🏭",
  stored: "📦", shipped: "🚚", transported: "🚚",
  arrived: "📍", sold: "🛒", recalled: "⚠️",
  checked: "✅", created: "📋", inspected: "🔍",
  departed: "🚀", delivered: "✅", loaded: "📤",
};

const EVENT_LABEL: Record<string, string> = {
  harvested: "Geerntet", planted: "Gepflanzt", processed: "Verarbeitet",
  stored: "Eingelagert", shipped: "Versandt", transported: "Transportiert",
  arrived: "Angekommen", sold: "Verkauft", recalled: "Rückruf",
  checked: "Geprüft", created: "Erstellt", inspected: "Inspiziert",
  departed: "Abgegangen", delivered: "Geliefert", loaded: "Verladen",
};

function iconFor(t: string) { return EVENT_ICON[t.toLowerCase()] ?? "📌"; }
function labelFor(t: string) { return EVENT_LABEL[t.toLowerCase()] ?? t; }

export default function JourneyTimeline({ events }: Props) {
  if (!events.length) return null;
  const lastIdx = events.length - 1;

  return (
    <div className="card">
      <h3 className="card-title">Reiseverlauf</h3>
      <div className="timeline">
        {events.map((e, i) => {
          const isCurrent = i === lastIdx;
          const hasBreach = e.temp_celsius != null && e.event_type.toLowerCase() === "recalled";
          return (
            <div key={e.event_id} className="timeline-step">
              <div className="timeline-left">
                <div className={`timeline-dot ${isCurrent ? "timeline-dot--active" : ""} ${hasBreach ? "timeline-dot--breach" : ""}`}>
                  {iconFor(e.event_type)}
                </div>
                {i < lastIdx && <div className="timeline-line" />}
              </div>
              <div className="timeline-content">
                <div className="timeline-event-type">
                  {labelFor(e.event_type)}
                  {isCurrent && <span className="timeline-current-tag">Aktuell</span>}
                </div>
                {e.station_name && <div className="timeline-station">{e.station_name}</div>}
                {e.location && <div className="timeline-location">{e.location}</div>}
                <div className="timeline-time">{formatDate(e.timestamp)}</div>
                {e.temp_celsius != null && (
                  <div className="timeline-temp">🌡️ {e.temp_celsius}°C</div>
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
