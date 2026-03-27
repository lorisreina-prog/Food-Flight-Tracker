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

export default function AchievementToast({ achievement }: Props) {
  if (!achievement) return null;

  const name = ACHIEVEMENT_NAME[achievement.achievement_type] ?? achievement.achievement_type;

  return (
    <div className="achievement-toast" role="status" aria-live="polite">
      <span className="achievement-icon">🏆</span>
      <div>
        <div className="achievement-title">Neues Achievement!</div>
        <div className="achievement-label">{name}</div>
      </div>
    </div>
  );
}
