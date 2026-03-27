export function formatDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export interface JourneyEvent {
  event_id: number;
  station_name: string | null;
  station_type: string | null;
  location: string | null;
  event_type: string;
  timestamp: string;
  temp_celsius: number | null;
  co2_kg: number | null;
  notes: string | null;
}

export interface RecallItem {
  recall_id: number;
  reason: string;
  severity: string;
  issued_at: string;
  resolved_at: string | null;
  issued_by: string;
}

export interface CertificateItem {
  cert_id: number;
  cert_type: string;
  issued_by: string;
  valid_until: string;
  verified: boolean;
}

export interface QualityCheckItem {
  check_id: number;
  station_name: string;
  checked_at: string;
  passed: boolean;
  notes: string | null;
}

export interface BatchDetail {
  batch_id: number;
  product_name: string;
  product_category: string;
  origin_farm: string;
  origin_country: string;
  harvest_date: string;
  qr_code: string;
  recall_status: string;
  trust_score: number | null;
  nutri_grade: string | null;
  risk_level: string | null;
  risk_score: number | null;
  crowd_score: number | null;
  journey: JourneyEvent[];
  recalls: RecallItem[];
  certificates: CertificateItem[];
  quality_checks: QualityCheckItem[];
  co2_total_kg: number | null;
  cold_chain_ok: boolean | null;
}

export interface BatchListItem {
  batch_id: number;
  product_name: string;
  qr_code: string;
  origin_country: string;
  harvest_date: string;
  recall_status: string;
  trust_score: number | null;
  nutri_grade: string | null;
  created_at: string;
}

export interface RiskResponse {
  risk_score: number;
  risk_level: string;
  risk_factors: string[];
  ai_explanation: string;
  shelf_life_days: number | null;
  predicted_at: string;
}

export interface ColdChainLogEntry {
  station_name: string;
  recorded_at: string;
  temp_celsius: number;
  min_temp: number;
  max_temp: number;
  within_range: boolean;
}

export interface ColdChainResponse {
  logs: ColdChainLogEntry[];
  breaches: number;
  cold_chain_ok: boolean;
}

export interface IoTReadingEntry {
  sensor_type: string;
  value: number;
  recorded_at: string;
  station_name: string;
}

export interface IoTLiveResponse {
  readings: IoTReadingEntry[];
  latest_temp: number | null;
  latest_humidity: number | null;
}

export interface NutriScoreResponse {
  grade: string;
  energy_kcal: number;
  fat_g: number;
  saturated_fat_g: number;
  sugar_g: number;
  salt_g: number;
  fiber_g: number;
  protein_g: number;
}

export interface EcoFootprintResponse {
  co2_total_kg: number;
  water_liters: number;
  land_sqm: number;
  transport_km: number;
}

export interface PriceBreakdownItem {
  stage: string;
  cost_chf: number;
  margin_pct: number;
  notes: string | null;
}

export interface LeaderboardItem {
  batch_id: number;
  product_name: string;
  origin_country: string;
  trust_score: number;
  nutri_grade: string | null;
}

export interface ActiveRecall {
  recall_id: number;
  batch_id: number;
  product_name: string;
  reason: string;
  severity: string;
  issued_at: string;
  issued_by: string;
}

export interface ComplaintListItem {
  complaint_id: number;
  batch_id: number;
  product_name: string;
  reporter_name: string;
  category: string;
  status: string;
  submitted_at: string;
}

export interface AchievementItem {
  achievement_type: string;
  earned_at: string;
  batch_id: number | null;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
