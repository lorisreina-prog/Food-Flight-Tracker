from __future__ import annotations
from typing import Optional, List, Any
from pydantic import BaseModel, validator


class AutoImportRequest(BaseModel):
    barcode: str

    @validator("barcode")
    def barcode_must_be_valid(cls, v):
        v = v.strip()
        if not v:
            raise ValueError("barcode is required")
        if len(v) > 50:
            raise ValueError("barcode too long")
        return v


class JourneyEvent(BaseModel):
    event_id: int
    station_name: Optional[str]
    station_type: Optional[str]
    location: Optional[str]
    event_type: str
    timestamp: str
    temp_celsius: Optional[float]
    co2_kg: Optional[float]
    notes: Optional[str]


class RecallItem(BaseModel):
    recall_id: int
    reason: str
    severity: str
    issued_at: str
    resolved_at: Optional[str]
    issued_by: str


class CertificateItem(BaseModel):
    cert_id: int
    cert_type: str
    issued_by: str
    valid_until: str
    verified: bool


class QualityCheckItem(BaseModel):
    check_id: int
    station_name: str
    checked_at: str
    passed: bool
    notes: Optional[str]


class BatchDetail(BaseModel):
    batch_id: int
    product_name: str
    product_category: str
    origin_farm: str
    origin_country: str
    harvest_date: str
    qr_code: str
    batch_code: Optional[str]
    recall_status: str
    trust_score: Optional[int]
    nutri_grade: Optional[str]
    risk_level: Optional[str]
    risk_score: Optional[int]
    crowd_score: Optional[float]
    journey: List[JourneyEvent]
    recalls: List[RecallItem]
    certificates: List[CertificateItem]
    quality_checks: List[QualityCheckItem]
    co2_total_kg: Optional[float]
    cold_chain_ok: Optional[bool]


class BatchListItem(BaseModel):
    batch_id: int
    product_name: str
    qr_code: str
    batch_code: Optional[str]
    origin_country: str
    harvest_date: str
    recall_status: str
    trust_score: Optional[int]
    nutri_grade: Optional[str]
    created_at: str


class BatchCreate(BaseModel):
    product_name: str
    product_category: str
    origin_farm: str
    origin_country: str
    harvest_date: str
    batch_code: Optional[str] = None


class BatchCreated(BaseModel):
    batch_id: int
    qr_code: str
    batch_code: Optional[str]
    qr_image_url: str


class EventCreate(BaseModel):
    station_id: Optional[int] = None
    event_type: str
    timestamp: str
    notes: Optional[str] = None
    temp_celsius: Optional[float] = None
    co2_kg: Optional[float] = None


class EventCreated(BaseModel):
    event_id: int


class RecallCreate(BaseModel):
    reason: str
    severity: str
    issued_by: str


class RecallCreated(BaseModel):
    recall_id: int


class RecallResolved(BaseModel):
    recall_id: int
    resolved_at: str


class ActiveRecall(BaseModel):
    recall_id: int
    batch_id: int
    product_name: str
    reason: str
    severity: str
    issued_at: str
    issued_by: str


class ComplaintCreate(BaseModel):
    reporter_name: str
    reporter_email: Optional[str] = None
    description: str
    category: str
    user_token: Optional[str] = None


class ComplaintCreated(BaseModel):
    complaint_id: int


class ComplaintListItem(BaseModel):
    complaint_id: int
    batch_id: int
    product_name: str
    reporter_name: str
    category: str
    status: str
    submitted_at: str


class ComplaintStatusUpdate(BaseModel):
    status: str


class ComplaintStatusResult(BaseModel):
    complaint_id: int
    status: str


class StationItem(BaseModel):
    station_id: int
    name: str
    type: str
    location: str
    operator: str


class StationCreate(BaseModel):
    name: str
    type: str
    location: str
    operator: str


class StationCreated(BaseModel):
    station_id: int


class RiskResponse(BaseModel):
    risk_score: int
    risk_level: str
    risk_factors: List[str]
    ai_explanation: str
    shelf_life_days: Optional[int]
    predicted_at: str


class ChatRequest(BaseModel):
    message: str
    session_id: str


class ChatResponse(BaseModel):
    reply: str
    session_id: str


class AlternativeItem(BaseModel):
    alt_id: int
    product_name: str
    reason: str
    co2_kg: Optional[float]
    nutri_grade: Optional[str]
    trust_score: Optional[int]


class ColdChainLogEntry(BaseModel):
    station_name: str
    recorded_at: str
    temp_celsius: float
    min_temp: float
    max_temp: float
    within_range: bool


class ColdChainResponse(BaseModel):
    logs: List[ColdChainLogEntry]
    breaches: int
    cold_chain_ok: bool


class ColdChainLogCreate(BaseModel):
    station_id: int
    temp_celsius: float
    min_temp: float
    max_temp: float


class ColdChainLogCreated(BaseModel):
    log_id: int
    within_range: bool


class IoTReadingEntry(BaseModel):
    sensor_type: str
    value: float
    recorded_at: str
    station_name: str


class IoTLiveResponse(BaseModel):
    readings: List[IoTReadingEntry]
    latest_temp: Optional[float]
    latest_humidity: Optional[float]


class IoTReadingCreate(BaseModel):
    station_id: int
    sensor_type: str
    value: float


class IoTReadingCreated(BaseModel):
    reading_id: int


class IoTAnomalyItem(BaseModel):
    reading_id: int
    sensor_type: str
    value: float
    recorded_at: str
    station_name: str
    notes: str


class IoTSimulateResponse(BaseModel):
    inserted: int


class NutriScoreResponse(BaseModel):
    grade: str
    energy_kcal: float
    fat_g: float
    saturated_fat_g: float
    sugar_g: float
    salt_g: float
    fiber_g: float
    protein_g: float


class NutriScoreCreate(BaseModel):
    energy_kcal: float
    fat_g: float
    saturated_fat_g: float
    sugar_g: float
    salt_g: float
    fiber_g: float
    protein_g: float


class NutriScoreCreated(BaseModel):
    nutri_id: int
    grade: str


class EcoFootprintResponse(BaseModel):
    co2_total_kg: float
    water_liters: float
    land_sqm: float
    transport_km: int


class EcoFootprintCreate(BaseModel):
    co2_total_kg: float
    water_liters: float
    land_sqm: float
    transport_km: int


class EcoFootprintCreated(BaseModel):
    eco_id: int


class PriceBreakdownItem(BaseModel):
    stage: str
    cost_chf: float
    margin_pct: float
    notes: Optional[str]


class PriceBreakdownCreate(BaseModel):
    stage: str
    cost_chf: float
    margin_pct: float
    notes: Optional[str] = None


class PriceBreakdownCreated(BaseModel):
    price_id: int


class TrustScoreResponse(BaseModel):
    score: int
    factors: Any


class LeaderboardItem(BaseModel):
    batch_id: int
    product_name: str
    origin_country: str
    trust_score: int
    nutri_grade: Optional[str]


class CrowdRatingCreate(BaseModel):
    stars: int
    comment: Optional[str] = None
    user_token: str


class CrowdRatingCreated(BaseModel):
    rating_id: int


class AchievementItem(BaseModel):
    achievement_type: str
    earned_at: str
    batch_id: Optional[int]


class OcrRequest(BaseModel):
    image_base64: str
    user_token: Optional[str] = None


class OcrResponse(BaseModel):
    qr_code: str
    batch_id: int


class ScanRegisterRequest(BaseModel):
    qr_code: str
    user_token: str


class ScanRegisterResponse(BaseModel):
    batch_id: int
    qr_code: str
    already_registered: bool


class AuthRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    email: str
