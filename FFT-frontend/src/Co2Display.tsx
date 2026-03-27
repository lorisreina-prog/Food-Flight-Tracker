interface Props {
  co2TotalKg: number | null;
}

export default function Co2Display({ co2TotalKg }: Props) {
  if (co2TotalKg == null) return null;

  const level = co2TotalKg < 1 ? "low" : co2TotalKg < 5 ? "medium" : "high";
  const color = level === "low" ? "var(--green)" : level === "medium" ? "var(--amber)" : "var(--red)";
  const bg = level === "low" ? "var(--green-lt)" : level === "medium" ? "var(--amber-lt)" : "var(--red-lt)";

  return (
    <div className="card">
      <h3 className="card-title">CO₂-Bilanz Reise</h3>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{
          width: 52, height: 52, borderRadius: "50%", background: bg,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 24, flexShrink: 0,
        }}>
          🌍
        </div>
        <div>
          <div style={{ fontSize: 26, fontWeight: 800, color, letterSpacing: "-.02em" }}>
            {co2TotalKg.toFixed(2)} kg
          </div>
          <div style={{ fontSize: 12, color: "var(--tx-3)", marginTop: 2 }}>
            CO₂-Emissionen auf dem Transportweg
          </div>
        </div>
      </div>
    </div>
  );
}
