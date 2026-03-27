interface Props {
  co2TotalKg: number | null;
}

export default function Co2Display({ co2TotalKg }: Props) {
  if (co2TotalKg == null) return null;
  return (
    <div className="card co2-card">
      <span className="co2-icon">🌍</span>
      <div>
        <div className="co2-value">{co2TotalKg.toFixed(2)} kg CO₂</div>
        <div className="co2-label">Gesamtemissionen (Reise)</div>
      </div>
    </div>
  );
}
