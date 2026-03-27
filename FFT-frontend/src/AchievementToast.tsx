import type { AchievementItem } from "./types";

interface Props {
  achievement?: AchievementItem | null;
  userToken?: string;
  batchId?: number;
}

const ACHIEVEMENT_NAME: Record<string, string> = {
  first_scan: "Erster Scan",
  recall_reporter: "Rückruf-Reporter",
  explorer: "Entdecker (10 Produkte)",
  quality_checker: "Qualitätsprüfer",
  trusted_source: "Vertrauensquelle",
  scan: "Erstes Scan",
  complaint: "Beanstandung eingereicht",
  rating: "Produkt bewertet",
};

const SvgAward = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="6" />
    <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
  </svg>
);

export default function AchievementToast({ achievement }: Props) {
  if (!achievement) return null;

  const name = ACHIEVEMENT_NAME[achievement.achievement_type] ?? achievement.achievement_type;

  return (
    <div className="achievement-toast" role="status" aria-live="polite">
      <span className="achievement-icon"><SvgAward /></span>
      <div>
        <div className="achievement-title">Neues Achievement</div>
        <div className="achievement-label">{name}</div>
      </div>
    </div>
  );
}
