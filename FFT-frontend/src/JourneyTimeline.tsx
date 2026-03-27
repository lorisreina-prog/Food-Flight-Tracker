import type { JourneyEvent } from "./types";
import { formatDate } from "./types";

interface Props {
  events: JourneyEvent[];
}

const SvgHarvest = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22V12" /><path d="M5 12c0-3.9 3.1-7 7-7s7 3.1 7 7" />
    <path d="M5 12H2" /><path d="M22 12h-3" />
  </svg>
);

const SvgFactory = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 20h20" /><path d="M2 20V8l6-4v4l6-4v16" />
    <path d="M14 20V10h4v10" />
  </svg>
);

const SvgBox = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="21 8 21 21 3 21 3 8" />
    <rect x="1" y="3" width="22" height="5" />
    <line x1="10" y1="12" x2="14" y2="12" />
  </svg>
);

const SvgTruck = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13" />
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);

const SvgMapPin = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const SvgShoppingBag = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
);

const SvgAlertTriangle = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const SvgCheckCircle = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const SvgFileText = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

const SvgSearch = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const SvgArrowRight = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 8 16 12 12 16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);

const SvgUpload = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 16 12 12 8 16" />
    <line x1="12" y1="12" x2="12" y2="21" />
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
  </svg>
);

const SvgThermometer = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
  </svg>
);

const EVENT_ICON: Record<string, React.ReactNode> = {
  harvested: <SvgHarvest />,
  planted: <SvgHarvest />,
  processed: <SvgFactory />,
  stored: <SvgBox />,
  shipped: <SvgTruck />,
  transported: <SvgTruck />,
  arrived: <SvgMapPin />,
  sold: <SvgShoppingBag />,
  recalled: <SvgAlertTriangle />,
  checked: <SvgCheckCircle />,
  created: <SvgFileText />,
  inspected: <SvgSearch />,
  departed: <SvgArrowRight />,
  delivered: <SvgCheckCircle />,
  loaded: <SvgUpload />,
};

const EVENT_LABEL: Record<string, string> = {
  harvested: "Geerntet", planted: "Gepflanzt", processed: "Verarbeitet",
  stored: "Eingelagert", shipped: "Versandt", transported: "Transportiert",
  arrived: "Angekommen", sold: "Verkauft", recalled: "Rückruf",
  checked: "Geprüft", created: "Erstellt", inspected: "Inspiziert",
  departed: "Abgegangen", delivered: "Geliefert", loaded: "Verladen",
};

function iconFor(t: string): React.ReactNode {
  return EVENT_ICON[t.toLowerCase()] ?? <SvgMapPin />;
}

function labelFor(t: string): string {
  return EVENT_LABEL[t.toLowerCase()] ?? t;
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
                  <div className="timeline-temp">
                    <SvgThermometer />
                    {e.temp_celsius}°C
                  </div>
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
