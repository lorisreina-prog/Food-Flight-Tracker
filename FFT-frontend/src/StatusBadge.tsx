interface Props {
  status: string;
  size?: "sm" | "md";
}

const CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  critical: { label: "Rückruf",  bg: "#FEE2E2", text: "#B91C1C", border: "#FECACA" },
  warning:  { label: "Warnung",  bg: "#FEF3C7", text: "#92400E", border: "#FDE68A" },
  info:     { label: "Info",     bg: "#EEF2FF", text: "#3730A3", border: "#C7D2FE" },
  none:     { label: "OK",       bg: "#D1FAE5", text: "#065F46", border: "#A7F3D0" },
};

export default function StatusBadge({ status, size = "md" }: Props) {
  const c = CONFIG[status] ?? CONFIG["none"];
  return (
    <span style={{
      background: c.bg, color: c.text,
      border: `1px solid ${c.border}`,
      borderRadius: 999,
      padding: size === "sm" ? "2px 8px" : "3px 10px",
      fontSize: size === "sm" ? 11 : 12,
      fontWeight: 700, display: "inline-block", lineHeight: 1.4,
      letterSpacing: ".01em",
    }}>
      {c.label}
    </span>
  );
}
