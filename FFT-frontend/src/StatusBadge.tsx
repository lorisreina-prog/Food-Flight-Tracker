interface Props {
  status: string;
  size?: "sm" | "md";
}

const LABEL: Record<string, string> = {
  critical: "Kritisch",
  warning: "Warnung",
  info: "Info",
  none: "OK",
};

const COLOR: Record<string, string> = {
  critical: "#DC2626",
  warning: "#D97706",
  info: "#2563EB",
  none: "#16A34A",
};

export default function StatusBadge({ status, size = "md" }: Props) {
  const bg = COLOR[status] ?? COLOR["none"];
  const label = LABEL[status] ?? status;
  const padding = size === "sm" ? "2px 7px" : "3px 10px";
  const fontSize = size === "sm" ? "11px" : "13px";
  return (
    <span
      style={{
        background: bg,
        color: "#fff",
        borderRadius: "999px",
        padding,
        fontSize,
        fontWeight: 600,
        display: "inline-block",
        lineHeight: 1.4,
      }}
    >
      {label}
    </span>
  );
}
