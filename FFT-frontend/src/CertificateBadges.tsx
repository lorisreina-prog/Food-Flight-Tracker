import type { CertificateItem } from "./types";
import { formatDate } from "./types";

const SvgVerified = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

interface Props {
  certificates: CertificateItem[];
}

const CERT_COLORS = [
  { bg: "#ECFDF5", text: "#065F46", border: "#A7F3D0" },
  { bg: "#EEF2FF", text: "#3730A3", border: "#C7D2FE" },
  { bg: "#FAF5FF", text: "#6B21A8", border: "#E9D5FF" },
  { bg: "#FFFBEB", text: "#92400E", border: "#FDE68A" },
  { bg: "#ECFEFF", text: "#164E63", border: "#A5F3FC" },
];

export default function CertificateBadges({ certificates }: Props) {
  if (!certificates.length) return null;
  return (
    <div className="card">
      <h3 className="card-title">Zertifikate & Siegel</h3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {certificates.map((c, i) => {
          const scheme = CERT_COLORS[i % CERT_COLORS.length];
          return (
            <div key={c.cert_id} style={{
              background: scheme.bg, border: `1px solid ${scheme.border}`,
              borderRadius: 8, padding: "8px 12px",
              display: "flex", flexDirection: "column", gap: 2,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: scheme.text }}>{c.cert_type}</span>
                {c.verified && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, color: scheme.text,
                    background: scheme.border, borderRadius: 999, padding: "2px 7px",
                    display: "inline-flex", alignItems: "center", gap: 3,
                  }}>
                    <SvgVerified /> Verifiziert
                  </span>
                )}
              </div>
              <span style={{ fontSize: 11, color: scheme.text, opacity: .7 }}>
                Gültig bis {formatDate(c.valid_until).split(" ")[0]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
