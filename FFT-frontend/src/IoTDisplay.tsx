import { useEffect, useState, useRef } from "react";
import { api } from "./api";
import type { IoTLiveResponse, IoTReadingEntry } from "./types";

interface Props {
  batchId: number;
}

const W = 300;
const H = 60;
const PAD = { top: 6, right: 8, bottom: 6, left: 8 };

function sparkline(vals: number[]): string {
  if (vals.length < 2) return "";
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  return vals.map((v, i) => {
    const x = PAD.left + (i / (vals.length - 1)) * (W - PAD.left - PAD.right);
    const y = H - PAD.bottom - ((v - min) / range) * (H - PAD.top - PAD.bottom);
    return `${x},${y}`;
  }).join(" ");
}

export default function IoTDisplay({ batchId }: Props) {
  const [data, setData] = useState<IoTLiveResponse | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = () => {
    api.getIotLive(batchId).then(setData).catch(() => {});
  };

  useEffect(() => {
    load();
    timerRef.current = setInterval(load, 10000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [batchId]);

  if (!data || !data.readings.length) return null;

  const temps = data.readings
    .filter((r: IoTReadingEntry) => r.sensor_type === "temperature")
    .map((r: IoTReadingEntry) => r.value)
    .reverse();

  const humids = data.readings
    .filter((r: IoTReadingEntry) => r.sensor_type === "humidity")
    .map((r: IoTReadingEntry) => r.value)
    .reverse();

  return (
    <div className="card">
      <h3 className="card-title">IoT Live-Daten</h3>
      <div className="iot-row">
        <div className="iot-metric">
          <span className="iot-label">Temperatur</span>
          <span className="iot-value">{data.latest_temp != null ? `${data.latest_temp}°C` : "—"}</span>
          {temps.length > 1 && (
            <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
              <polyline points={sparkline(temps)} fill="none" stroke="#2563EB" strokeWidth="1.5" />
            </svg>
          )}
        </div>
        <div className="iot-metric">
          <span className="iot-label">Luftfeuchtigkeit</span>
          <span className="iot-value">{data.latest_humidity != null ? `${data.latest_humidity}%` : "—"}</span>
          {humids.length > 1 && (
            <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
              <polyline points={sparkline(humids)} fill="none" stroke="#16A34A" strokeWidth="1.5" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}
