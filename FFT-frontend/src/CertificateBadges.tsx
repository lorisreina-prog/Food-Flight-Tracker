import type { CertificateItem } from "./types";
import { formatDate } from "./types";

interface Props {
  certificates: CertificateItem[];
}

const CERT_COLORS = ["#16A34A", "#2563EB", "#9333ea", "#D97706", "#0891b2"];

export default function CertificateBadges({ certificates }: Props) {
  if (!certificates.length) return null;
  return (
    <div className="card">
      <h3 className="card-title">Zertifikate</h3>
      <div className="cert-chips">
        {certificates.map((c, i) => (
          <div key={c.cert_id} className="cert-chip"
            style={{ background: CERT_COLORS[i % CERT_COLORS.length] }}>
            <span className="cert-type">{c.cert_type}</span>
            {c.verified && <span className="cert-verified">✓</span>}
            <span className="cert-expiry">bis {formatDate(c.valid_until).split(" ")[0]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
