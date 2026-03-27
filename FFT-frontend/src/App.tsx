import { useEffect, useRef, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { api } from "./api";
import type { AchievementItem } from "./types";
import ScanPage from "./ScanPage";
import ScannerPage from "./ScannerPage";
import AdminPage from "./AdminPage";
import AchievementToast from "./AchievementToast";

if (!localStorage.getItem("fft_user_token")) {
  localStorage.setItem("fft_user_token", crypto.randomUUID());
}

const STORAGE_KEY = "fft_achievements";

function loadSeen(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveSeen(seen: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...seen]));
}

function achievementId(a: AchievementItem): string {
  return `${a.achievement_type}_${a.earned_at}`;
}

export default function App() {
  const [pending, setPending] = useState<AchievementItem | null>(null);
  const clearRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("fft_user_token")!;

    const check = () => {
      api.getAchievements(token).then((items) => {
        const seen = loadSeen();
        const fresh = items.find((a) => !seen.has(achievementId(a)));
        if (!fresh) return;
        seen.add(achievementId(fresh));
        saveSeen(seen);
        if (clearRef.current) clearTimeout(clearRef.current);
        setPending(fresh);
        clearRef.current = setTimeout(() => setPending(null), 4000);
      }).catch(() => {});
    };

    check();
    const interval = setInterval(check, 30000);
    return () => {
      clearInterval(interval);
      if (clearRef.current) clearTimeout(clearRef.current);
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/admin" replace />} />
        <Route path="/scan/:qr_code" element={<ScanPage />} />
        <Route path="/scanner" element={<ScannerPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
      <AchievementToast achievement={pending} />
    </BrowserRouter>
  );
}
