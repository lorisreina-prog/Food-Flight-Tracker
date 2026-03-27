import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "./api";
import Logo from "./Logo";
import type { BatchDetail } from "./types";
import { formatDate } from "./types";
import RecallBanner from "./RecallBanner";
import RiskCard from "./RiskCard";
import JourneyTimeline from "./JourneyTimeline";
import ColdChainChart from "./ColdChainChart";
import IoTDisplay from "./IoTDisplay";
import NutriScoreBadge from "./NutriScoreBadge";
import EcoFootprint from "./EcoFootprint";
import PriceBreakdown from "./PriceBreakdown";
import Co2Display from "./Co2Display";
import CertificateBadges from "./CertificateBadges";
import ChatAssistant from "./ChatAssistant";
import CrowdRating from "./CrowdRating";
import AchievementToast from "./AchievementToast";
import ComplaintForm from "./ComplaintForm";

const TRUST_COLOR = (s: number) => s < 40 ? "#DC2626" : s <= 70 ? "#D97706" : "#059669";
const NUTRI_COLOR: Record<string, string> = {
  A: "#059669", B: "#65A30D", C: "#D97706", D: "#EA580C", E: "#DC2626",
};

const NUTRI_CFG: Record<string, { bg: string; text: string }> = {
  a: { bg: "#059669", text: "#fff" },
  b: { bg: "#65A30D", text: "#fff" },
  c: { bg: "#D97706", text: "#fff" },
  d: { bg: "#EA580C", text: "#fff" },
  e: { bg: "#DC2626", text: "#fff" },
};

const IconCamera = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

const IconRefresh = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10" />
    <path d="M3.51 15a9 9 0 1 0 .49-3.68" />
  </svg>
);

const IconSearch = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconWifi = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="1" y1="1" x2="23" y2="23" />
    <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
    <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
    <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
    <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
    <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
    <line x1="12" y1="20" x2="12.01" y2="20" />
  </svg>
);

const IconGlobe = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

interface OFFProduct {
  product_name: string;
  brands?: string;
  quantity?: string;
  categories?: string;
  origins?: string;
  countries?: string;
  nutriscore_grade?: string;
  labels?: string;
  ingredients_text?: string;
  image_front_url?: string;
  nutriments?: Record<string, number>;
}

async function fetchOpenFoodFacts(barcode: string): Promise<OFFProduct | null> {
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
    const data = await res.json();
    if (data.status === 1 && data.product?.product_name) return data.product as OFFProduct;
  } catch {}
  return null;
}

function ExternalProduct({ product, barcode }: { product: OFFProduct; barcode: string }) {
  const grade = product.nutriscore_grade?.toLowerCase();
  const nm = product.nutriments ?? {};

  const nutrients: { label: string; key: string; unit: string }[] = [
    { label: "Energie", key: "energy-kcal_100g", unit: "kcal" },
    { label: "Fett", key: "fat_100g", unit: "g" },
    { label: "Davon gesättigt", key: "saturated-fat_100g", unit: "g" },
    { label: "Zucker", key: "sugars_100g", unit: "g" },
    { label: "Ballaststoffe", key: "fiber_100g", unit: "g" },
    { label: "Protein", key: "proteins_100g", unit: "g" },
    { label: "Salz", key: "salt_100g", unit: "g" },
  ];

  return (
    <div className="scan-page">
      <div className="scan-topbar">
        <div className="scan-topbar-logo">
          <Logo size={24} />
          FOODTRACE
        </div>
        <Link to="/scanner" className="scan-topbar-action">
          <IconCamera />
          Scan
        </Link>
      </div>

      <div className="external-product-notice">
        <div className="external-product-icon"><IconGlobe /></div>
        <div>
          <div className="external-product-title">Externes Produkt</div>
          <div className="external-product-sub">
            Nicht im Provena-System — Daten von Open Food Facts (Barcode: {barcode})
          </div>
        </div>
      </div>

      <div className="card product-header">
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          {product.image_front_url && (
            <img
              src={product.image_front_url}
              alt={product.product_name}
              style={{ width: 80, height: 80, objectFit: "contain", borderRadius: 8, flexShrink: 0, border: "1px solid var(--border)" }}
            />
          )}
          <div style={{ flex: 1 }}>
            <h1 className="product-name" style={{ fontSize: "1.6rem" }}>{product.product_name}</h1>
            <div className="product-meta">
              {product.brands && <span className="product-origin">{product.brands}</span>}
              {product.quantity && (
                <>
                  <span className="product-origin-sep">·</span>
                  <span className="product-harvest">{product.quantity}</span>
                </>
              )}
            </div>
            <div className="product-badges" style={{ marginTop: 8 }}>
              {grade && NUTRI_CFG[grade] && (
                <span style={{
                  background: NUTRI_CFG[grade].bg, color: NUTRI_CFG[grade].text,
                  borderRadius: 8, padding: "4px 12px", fontWeight: 900, fontSize: 15,
                }}>
                  Nutri-{grade.toUpperCase()}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {(product.origins || product.countries) && (
        <div className="card">
          <h3 className="card-title">Herkunft</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {product.origins && (
              <div style={{ display: "flex", gap: 10, fontSize: 14 }}>
                <span style={{ color: "var(--tx-3)", minWidth: 80 }}>Herkunft</span>
                <span style={{ fontWeight: 600 }}>{product.origins}</span>
              </div>
            )}
            {product.countries && (
              <div style={{ display: "flex", gap: 10, fontSize: 14 }}>
                <span style={{ color: "var(--tx-3)", minWidth: 80 }}>Länder</span>
                <span style={{ fontWeight: 600 }}>{product.countries.split(",").slice(0, 3).join(", ")}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {grade && (
        <div className="card">
          <h3 className="card-title">Nutri-Score</h3>
          <div style={{ display: "flex", gap: 5, marginBottom: 14 }}>
            {["a","b","c","d","e"].map((g) => {
              const cfg = NUTRI_CFG[g] ?? { bg: "#94A3B8", text: "#fff" };
              const active = g === grade;
              return (
                <div key={g} style={{
                  width: active ? 44 : 36, height: active ? 44 : 36,
                  borderRadius: active ? 10 : 8,
                  background: active ? cfg.bg : `${cfg.bg}22`,
                  color: active ? "#fff" : cfg.bg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 900, fontSize: active ? 20 : 15,
                  transition: "all .15s",
                  boxShadow: active ? `0 4px 12px ${cfg.bg}50` : "none",
                }}>
                  {g.toUpperCase()}
                </div>
              );
            })}
          </div>

          {Object.keys(nm).length > 0 && (
            <table className="nutri-table">
              <tbody>
                {nutrients.filter(n => nm[n.key] != null).map(n => (
                  <tr key={n.key}>
                    <td>{n.label}</td>
                    <td>{Number(nm[n.key]).toFixed(n.unit === "kcal" ? 0 : 1)} {n.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {product.labels && (
        <div className="card">
          <h3 className="card-title">Siegel & Labels</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {product.labels.split(",").map((l) => l.trim()).filter(Boolean).map((label) => (
              <span key={label} style={{
                background: "var(--green-lt)", color: "#065F46",
                border: "1px solid #A7F3D0", borderRadius: 999,
                padding: "4px 10px", fontSize: 12, fontWeight: 600,
              }}>
                {label}
              </span>
            ))}
          </div>
        </div>
      )}

      {product.ingredients_text && (
        <div className="card">
          <h3 className="card-title">Zutaten</h3>
          <p style={{ fontSize: 13, color: "var(--tx-2)", lineHeight: 1.7 }}>
            {product.ingredients_text}
          </p>
        </div>
      )}

      {product.categories && (
        <div className="card">
          <h3 className="card-title">Kategorie</h3>
          <p style={{ fontSize: 13, color: "var(--tx-2)" }}>
            {product.categories.split(",").slice(0, 4).map(c => c.trim()).join(" · ")}
          </p>
        </div>
      )}

      <Link to="/scanner" className="scan-fab">
        <IconRefresh />
        Weiterscannen
      </Link>
    </div>
  );
}

const SvgStar = ({ filled }: { filled: boolean }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill={filled ? "#F59E0B" : "none"} stroke={filled ? "#F59E0B" : "#D1D5DB"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

function StarRow({ score }: { score: number }) {
  const full = Math.round(score);
  return (
    <span className="star-row">
      {[1,2,3,4,5].map((s) => <SvgStar key={s} filled={s <= full} />)}
      <span className="crowd-score-val">{score.toFixed(1)}</span>
    </span>
  );
}

function Skeleton() {
  return (
    <div className="scan-page">
      <div className="skeleton skeleton-title" style={{ width: "70%", height: 32 }} />
      <div className="skeleton skeleton-line" style={{ width: "50%" }} />
      <div className="skeleton skeleton-line" style={{ width: "35%", marginBottom: 20 }} />
      <div className="skeleton skeleton-card" style={{ height: 130 }} />
      <div className="skeleton skeleton-card" style={{ height: 160, marginTop: 10 }} />
    </div>
  );
}

export default function ScanPage() {
  const { qr_code } = useParams<{ qr_code: string }>();
  const [batch, setBatch] = useState<BatchDetail | null>(null);
  const [offProduct, setOffProduct] = useState<OFFProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [connError, setConnError] = useState(false);

  const userToken = localStorage.getItem("fft_user_token") ?? "";
  const sessionId = `${userToken}_${qr_code}`;
  const decoded = decodeURIComponent(qr_code ?? "");

  useEffect(() => {
    if (!decoded) return;
    setLoading(true);
    setBatch(null);
    setOffProduct(null);
    setNotFound(false);
    setConnError(false);

    api.getBatch(decoded)
      .then(setBatch)
      .catch(async (err: any) => {
        if (err?.status === 404) {
          if (/^\d{6,14}$/.test(decoded)) {
            const off = await fetchOpenFoodFacts(decoded);
            if (off) { setOffProduct(off); return; }
          }
          setNotFound(true);
        } else {
          setConnError(true);
        }
      })
      .finally(() => setLoading(false));
  }, [decoded]);

  if (loading) return <Skeleton />;

  if (offProduct) return <ExternalProduct product={offProduct} barcode={decoded} />;

  if (notFound) {
    return (
      <div className="scan-page scan-state">
        <div className="scan-state-icon" style={{ color: "var(--tx-3)" }}><IconSearch /></div>
        <h2>Produkt nicht gefunden</h2>
        <p>Code <code>{decoded}</code> ist nicht im System registriert.</p>
        <Link to="/scanner" style={{
          marginTop: 16, background: "var(--accent)", color: "#fff",
          padding: "10px 24px", borderRadius: "var(--radius-sm)", fontWeight: 700,
          display: "inline-flex", alignItems: "center", gap: 8,
        }}>
          <IconCamera />
          Erneut scannen
        </Link>
      </div>
    );
  }

  if (connError) {
    return (
      <div className="scan-page scan-state">
        <div className="scan-state-icon" style={{ color: "var(--tx-3)" }}><IconWifi /></div>
        <h2>Verbindungsfehler</h2>
        <p>Server nicht erreichbar. Bitte erneut versuchen.</p>
      </div>
    );
  }

  if (!batch) return null;

  return (
    <div className="scan-page">
      <div className="scan-topbar">
        <div className="scan-topbar-logo">
          <Logo size={24} />
          FOODTRACE
        </div>
        <Link to="/admin" className="scan-topbar-action">
          Dashboard
        </Link>
      </div>

      {batch.recall_status !== "none" && (
        <RecallBanner status={batch.recall_status} recalls={batch.recalls} />
      )}

      <div className="card product-header">
        <h1 className="product-name">{batch.product_name}</h1>
        <div className="product-meta">
          <span className="product-origin">{batch.origin_farm}</span>
          <span className="product-origin-sep">·</span>
          <span className="product-origin">{batch.origin_country}</span>
          <span className="product-origin-sep">·</span>
          <span className="product-harvest">Ernte {formatDate(batch.harvest_date).split(" ")[0]}</span>
        </div>
        <div className="product-badges">
          {batch.trust_score != null && (
            <span className="trust-pill" style={{ background: TRUST_COLOR(batch.trust_score) }}>
              {batch.trust_score}
              <span className="trust-pill-label">/100 Vertrauen</span>
            </span>
          )}
          {batch.nutri_grade && (
            <span className="nutri-hero" style={{ background: NUTRI_COLOR[batch.nutri_grade] ?? "#6b7280" }}>
              {batch.nutri_grade}
            </span>
          )}
          {batch.crowd_score != null && <StarRow score={batch.crowd_score} />}
        </div>
      </div>

      <RiskCard batchId={batch.batch_id} />
      <JourneyTimeline events={batch.journey} />
      <IoTDisplay batchId={batch.batch_id} />
      {batch.cold_chain_ok != null && <ColdChainChart batchId={batch.batch_id} />}
      {batch.nutri_grade && <NutriScoreBadge batchId={batch.batch_id} grade={batch.nutri_grade} />}
      <EcoFootprint batchId={batch.batch_id} />
      <Co2Display co2TotalKg={batch.co2_total_kg} />
      <PriceBreakdown batchId={batch.batch_id} />
      <CertificateBadges certificates={batch.certificates} />
      <ChatAssistant batchId={batch.batch_id} sessionId={sessionId} />
      <CrowdRating batchId={batch.batch_id} userToken={userToken} />
      <ComplaintForm batchId={batch.batch_id} />
      <AchievementToast userToken={userToken} batchId={batch.batch_id} />

      <Link to="/scanner" className="scan-fab">
        <IconCamera />
        Scannen
      </Link>
    </div>
  );
}
