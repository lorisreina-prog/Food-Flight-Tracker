import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "./api";
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

const TRUST_COLOR = (score: number) =>
  score < 40 ? "#DC2626" : score <= 70 ? "#D97706" : "#16A34A";

const NUTRI_COLOR: Record<string, string> = {
  A: "#16A34A", B: "#65A30D", C: "#EAB308", D: "#F97316", E: "#DC2626",
};

function StarRow({ score }: { score: number }) {
  const full = Math.round(score);
  return (
    <span className="star-row">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} style={{ color: s <= full ? "#F59E0B" : "#d1d5db" }}>★</span>
      ))}
      <span className="crowd-score-val">{score.toFixed(1)}</span>
    </span>
  );
}

function Skeleton() {
  return (
    <div className="scan-page">
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-line" />
      <div className="skeleton skeleton-line" style={{ width: "60%" }} />
      <div className="skeleton skeleton-card" style={{ marginTop: 16, height: 120 }} />
    </div>
  );
}

export default function ScanPage() {
  const { qr_code } = useParams<{ qr_code: string }>();
  const [batch, setBatch] = useState<BatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [connError, setConnError] = useState(false);

  const userToken = localStorage.getItem("fft_user_token") ?? "";
  const sessionId = `${userToken}_${qr_code}`;

  useEffect(() => {
    if (!qr_code) return;
    setLoading(true);
    api.getBatch(qr_code)
      .then(setBatch)
      .catch((err: any) => {
        if (err?.status === 404) setNotFound(true);
        else setConnError(true);
      })
      .finally(() => setLoading(false));
  }, [qr_code]);

  if (loading) return <Skeleton />;

  if (notFound) {
    return (
      <div className="scan-page scan-state">
        <div className="scan-state-icon">🔍</div>
        <h2>Produkt nicht gefunden</h2>
        <p>QR-Code <code>{qr_code}</code> ist nicht im System registriert.</p>
      </div>
    );
  }

  if (connError) {
    return (
      <div className="scan-page scan-state">
        <div className="scan-state-icon">⚡</div>
        <h2>Verbindungsfehler</h2>
        <p>Server nicht erreichbar. Bitte erneut versuchen.</p>
      </div>
    );
  }

  if (!batch) return null;

  return (
    <div className="scan-page">
      {batch.recall_status !== "none" && (
        <RecallBanner status={batch.recall_status} recalls={batch.recalls} />
      )}

      <div className="product-header card">
        <h1 className="product-name">{batch.product_name}</h1>
        <p className="product-origin">{batch.origin_farm}, {batch.origin_country}</p>
        <p className="product-harvest">Ernte: {formatDate(batch.harvest_date).split(" ")[0]}</p>
        <div className="product-badges">
          {batch.trust_score != null && (
            <span className="badge" style={{ background: TRUST_COLOR(batch.trust_score) }}>
              Vertrauen {batch.trust_score}/100
            </span>
          )}
          {batch.nutri_grade && (
            <span className="badge" style={{ background: NUTRI_COLOR[batch.nutri_grade] ?? "#6b7280" }}>
              Nutri-{batch.nutri_grade}
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
    </div>
  );
}
