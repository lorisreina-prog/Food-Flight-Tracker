import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Lang } from "./i18n";

export type Theme = "emerald" | "ocean" | "violet" | "amber" | "rose" | "slate";
export type Mode = "light" | "dark";

interface ThemeConfig {
  label: string;
  accent: string;
  accentH: string;
  accentLt: string;
  accentRgb: string;
  accentOnDark: string;
  bg: string;
  surface2: string;
  border: string;
  border2: string;
  tx2light: string;
  tx3light: string;
  tx2dark: string;
  tx3dark: string;
  sidebarFrom: string;
  sidebarTo: string;
  shadow: string;
}

export const THEME_CONFIGS: Record<Theme, ThemeConfig> = {
  emerald: {
    label: "Emerald",
    accent: "#059669", accentH: "#047857", accentLt: "#D1FAE5",
    accentRgb: "5,150,105", accentOnDark: "#6EE7B7",
    bg: "#EDF7F1", surface2: "#F4FBF7", border: "#C8E6D4", border2: "#A6D4BC",
    tx2light: "#2D6046", tx3light: "#70A080",
    tx2dark: "#5E9A7A", tx3dark: "#385E48",
    sidebarFrom: "#071A0E", sidebarTo: "#0A2214",
    shadow: "rgba(5,150,105,",
  },
  ocean: {
    label: "Ocean",
    accent: "#2563EB", accentH: "#1D4ED8", accentLt: "#DBEAFE",
    accentRgb: "37,99,235", accentOnDark: "#93C5FD",
    bg: "#EFF6FF", surface2: "#F0F7FF", border: "#BFDBFE", border2: "#93C5FD",
    tx2light: "#1E40AF", tx3light: "#60A5FA",
    tx2dark: "#4A80D0", tx3dark: "#1E3A70",
    sidebarFrom: "#060E1E", sidebarTo: "#091428",
    shadow: "rgba(37,99,235,",
  },
  violet: {
    label: "Violet",
    accent: "#7C3AED", accentH: "#6D28D9", accentLt: "#EDE9FE",
    accentRgb: "124,58,237", accentOnDark: "#C4B5FD",
    bg: "#F5F3FF", surface2: "#F3F0FF", border: "#DDD6FE", border2: "#C4B5FD",
    tx2light: "#4C1D95", tx3light: "#8B5CF6",
    tx2dark: "#9070D0", tx3dark: "#4A2A90",
    sidebarFrom: "#100A2A", sidebarTo: "#160F38",
    shadow: "rgba(124,58,237,",
  },
  amber: {
    label: "Amber",
    accent: "#D97706", accentH: "#B45309", accentLt: "#FEF3C7",
    accentRgb: "217,119,6", accentOnDark: "#FCD34D",
    bg: "#FFFBEB", surface2: "#FFFDF5", border: "#FDE68A", border2: "#FCD34D",
    tx2light: "#78350F", tx3light: "#B45309",
    tx2dark: "#C09050", tx3dark: "#7A4A10",
    sidebarFrom: "#160D00", sidebarTo: "#201500",
    shadow: "rgba(217,119,6,",
  },
  rose: {
    label: "Rose",
    accent: "#E11D48", accentH: "#BE123C", accentLt: "#FFE4E6",
    accentRgb: "225,29,72", accentOnDark: "#FDA4AF",
    bg: "#FFF1F3", surface2: "#FFF5F6", border: "#FECDD3", border2: "#FDA4AF",
    tx2light: "#881337", tx3light: "#F43F5E",
    tx2dark: "#C04060", tx3dark: "#701028",
    sidebarFrom: "#190010", sidebarTo: "#240018",
    shadow: "rgba(225,29,72,",
  },
  slate: {
    label: "Slate",
    accent: "#475569", accentH: "#334155", accentLt: "#E2E8F0",
    accentRgb: "71,85,105", accentOnDark: "#94A3B8",
    bg: "#F1F5F9", surface2: "#F8FAFC", border: "#E2E8F0", border2: "#CBD5E1",
    tx2light: "#334155", tx3light: "#64748B",
    tx2dark: "#6080A0", tx3dark: "#304050",
    sidebarFrom: "#0F172A", sidebarTo: "#1E293B",
    shadow: "rgba(71,85,105,",
  },
};

const DARK_BASE = {
  bg: "#0C0F0D",
  surface: "#131816",
  surface2: "#192019",
  border: "#253028",
  border2: "#2E3D36",
  tx: "#E0EDE6",
};

function applyTheme(theme: Theme, mode: Mode) {
  const cfg = THEME_CONFIGS[theme];
  const dark = mode === "dark";
  const r = document.documentElement;

  r.style.setProperty("--accent",        cfg.accent);
  r.style.setProperty("--accent-h",      cfg.accentH);
  r.style.setProperty("--accent-lt",     cfg.accentLt);
  r.style.setProperty("--accent-rgb",    cfg.accentRgb);
  r.style.setProperty("--accent-on-dark", cfg.accentOnDark);
  r.style.setProperty("--sidebar-from",  cfg.sidebarFrom);
  r.style.setProperty("--sidebar-to",    cfg.sidebarTo);
  r.style.setProperty("--bg",            dark ? DARK_BASE.bg      : cfg.bg);
  r.style.setProperty("--surface",       dark ? DARK_BASE.surface : "#FFFFFF");
  r.style.setProperty("--surface-2",     dark ? DARK_BASE.surface2 : cfg.surface2);
  r.style.setProperty("--border",        dark ? DARK_BASE.border  : cfg.border);
  r.style.setProperty("--border-2",      dark ? DARK_BASE.border2 : cfg.border2);
  r.style.setProperty("--tx",            dark ? DARK_BASE.tx      : "#0A1E12");
  r.style.setProperty("--tx-2",          dark ? cfg.tx2dark       : cfg.tx2light);
  r.style.setProperty("--tx-3",          dark ? cfg.tx3dark       : cfg.tx3light);
  // Glow intensity: dimmer in dark mode to avoid harsh neon shadows
  r.style.setProperty("--glow-xs",  dark ? ".05" : ".12");
  r.style.setProperty("--glow-sm",  dark ? ".14" : ".28");
  r.style.setProperty("--glow-md",  dark ? ".20" : ".40");
  r.setAttribute("data-mode", mode);
}

interface SettingsCtx {
  theme: Theme;
  mode: Mode;
  lang: Lang;
  panelOpen: boolean;
  setTheme: (t: Theme) => void;
  setMode: (m: Mode) => void;
  setLang: (l: Lang) => void;
  openPanel: () => void;
  closePanel: () => void;
}

const Ctx = createContext<SettingsCtx | null>(null);

const STORAGE_KEY = "fft_settings";

function load(): { theme: Theme; mode: Mode; lang: Lang } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { theme: "emerald", mode: "light", lang: "de" };
}

function save(s: { theme: Theme; mode: Mode; lang: Lang }) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const saved = load();
  const [theme, setThemeState] = useState<Theme>(saved.theme);
  const [mode,  setModeState]  = useState<Mode>(saved.mode);
  const [lang,  setLangState]  = useState<Lang>(saved.lang);
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    applyTheme(theme, mode);
    save({ theme, mode, lang });
  }, [theme, mode, lang]);

  // Apply on first render
  useEffect(() => { applyTheme(theme, mode); }, []);

  const setTheme = (t: Theme) => setThemeState(t);
  const setMode  = (m: Mode)  => setModeState(m);
  const setLang  = (l: Lang)  => setLangState(l);

  return (
    <Ctx.Provider value={{
      theme, mode, lang, panelOpen,
      setTheme, setMode, setLang,
      openPanel: () => setPanelOpen(true),
      closePanel: () => setPanelOpen(false),
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useSettings(): SettingsCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSettings must be inside SettingsProvider");
  return ctx;
}
