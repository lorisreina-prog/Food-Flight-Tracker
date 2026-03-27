import { useEffect, useRef, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { api } from "./api";
import { isLoggedIn } from "./auth";
import type { AchievementItem } from "./types";
import ScanPage from "./ScanPage";
import ScannerPage from "./ScannerPage";
import AdminPage from "./AdminPage";
import LoginPage from "./LoginPage";
import RegisterPage from "./RegisterPage";
import AchievementToast from "./AchievementToast";
import { SettingsProvider } from "./SettingsContext";
import SettingsPanel from "./SettingsPanel";

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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return isLoggedIn() ? <>{children}</> : <Navigate to="/login" replace />;
}

function ScanPageRouted() {
  const { qr_code } = useParams<{ qr_code: string }>();
  return <ScanPage key={qr_code} />;
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
    <SettingsProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<Navigate to={isLoggedIn() ? "/admin" : "/login"} replace />} />
          <Route path="/scan/:qr_code" element={<ProtectedRoute><ScanPageRouted /></ProtectedRoute>} />
          <Route path="/scanner" element={<ProtectedRoute><ScannerPage /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
        </Routes>
        <AchievementToast achievement={pending} />
        <SettingsPanel />
      </BrowserRouter>
    </SettingsProvider>
  );
}
