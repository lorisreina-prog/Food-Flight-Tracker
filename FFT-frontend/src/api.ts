import type {
  BatchDetail, BatchListItem, RiskResponse, ColdChainResponse,
  IoTLiveResponse, NutriScoreResponse, EcoFootprintResponse,
  PriceBreakdownItem, LeaderboardItem, ActiveRecall,
  ComplaintListItem, AchievementItem,
} from "./types";

const BASE = import.meta.env.VITE_API_URL ?? "";

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${BASE}${path}`;
  const res = await fetch(url, init);
  if (!res.ok) {
    const err = new Error(`${res.status}`);
    (err as any).status = res.status;
    throw err;
  }
  return res.json() as Promise<T>;
}

export const api = {
  getBatch: (qrCode: string) =>
    req<BatchDetail>(`/api/batch/${qrCode}`),

  getBatches: () =>
    req<BatchListItem[]>("/api/batches"),

  getRisk: (batchId: number) =>
    req<RiskResponse>(`/api/batch/${batchId}/risk`),

  getColdChain: (batchId: number) =>
    req<ColdChainResponse>(`/api/batch/${batchId}/cold-chain`),

  getIotLive: (batchId: number) =>
    req<IoTLiveResponse>(`/api/batch/${batchId}/iot/live`),

  getNutriScore: (batchId: number) =>
    req<NutriScoreResponse>(`/api/batch/${batchId}/nutri-score`),

  getEcoFootprint: (batchId: number) =>
    req<EcoFootprintResponse>(`/api/batch/${batchId}/ecological-footprint`),

  getPriceBreakdown: (batchId: number) =>
    req<PriceBreakdownItem[]>(`/api/batch/${batchId}/price-breakdown`),

  getLeaderboard: () =>
    req<LeaderboardItem[]>("/api/leaderboard"),

  getActiveRecalls: () =>
    req<ActiveRecall[]>("/api/recalls/active"),

  getComplaints: () =>
    req<ComplaintListItem[]>("/api/complaints"),

  resolveRecall: (recallId: number) =>
    req<unknown>(`/api/recall/${recallId}/resolve`, { method: "PATCH" }),

  updateComplaintStatus: (complaintId: number, status: string) =>
    req<unknown>(`/api/complaint/${complaintId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }),

  submitCrowdRating: (batchId: number, stars: number, comment: string, userToken: string) =>
    req<unknown>(`/api/batch/${batchId}/crowd-rating`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stars, comment, user_token: userToken }),
    }),

  submitComplaint: (
    batchId: number,
    reporter_name: string,
    reporter_email: string,
    description: string,
    category: string,
    user_token?: string,
  ) =>
    req<unknown>(`/api/batch/${batchId}/complaint`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reporter_name, reporter_email, description, category, user_token }),
    }),

  registerScan: (qrCode: string, userToken: string) =>
    req<{ batch_id: number; qr_code: string; already_registered: boolean }>("/api/scan/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qr_code: qrCode, user_token: userToken }),
    }),

  sendChat: (batchId: number, message: string, sessionId: string) =>
    req<{ reply: string; session_id: string }>(`/api/batch/${batchId}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, session_id: sessionId }),
    }),

  getAchievements: (userToken: string) =>
    req<AchievementItem[]>(`/api/user/${userToken}/achievements`),

  scanOcr: (imageBase64: string) =>
    req<{ qr_code: string; batch_id: number }>("/api/scan/ocr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_base64: imageBase64 }),
    }),

  autoImport: (barcode: string) =>
    req<{ qr_code: string; created: boolean; product_name: string }>("/api/scan/auto-import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ barcode }),
    }),
};
