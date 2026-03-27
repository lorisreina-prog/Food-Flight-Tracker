import { useSettings, THEME_CONFIGS, type Theme, type Mode } from "./SettingsContext";
import type { Lang } from "./i18n";
import { getT } from "./i18n";

const SvgX = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const SvgSun = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const SvgMoon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const THEME_ORDER: Theme[] = ["emerald", "ocean", "violet", "amber", "rose", "slate"];
const LANG_OPTIONS: { code: Lang; flag: string; label: string }[] = [
  { code: "de", flag: "🇩🇪", label: "Deutsch" },
  { code: "en", flag: "🇬🇧", label: "English" },
  { code: "fr", flag: "🇫🇷", label: "Français" },
];

export default function SettingsPanel() {
  const { theme, mode, lang, panelOpen, closePanel, setTheme, setMode, setLang } = useSettings();
  const tr = getT(lang);

  if (!panelOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="settings-backdrop" onClick={closePanel} />

      {/* Panel */}
      <div className="settings-panel" role="dialog" aria-label={tr.settings}>
        {/* Header */}
        <div className="settings-header">
          <span className="settings-title">{tr.settings}</span>
          <button className="settings-close" onClick={closePanel} aria-label="Schliessen">
            <SvgX />
          </button>
        </div>

        <div className="settings-body">

          {/* ── Color Theme ─────────────────────────────────── */}
          <div className="settings-section">
            <div className="settings-section-label">{tr.colorTheme}</div>
            <div className="settings-theme-grid">
              {THEME_ORDER.map((t) => {
                const cfg = THEME_CONFIGS[t];
                const active = t === theme;
                return (
                  <button
                    key={t}
                    className={`settings-theme-swatch ${active ? "settings-theme-swatch--active" : ""}`}
                    onClick={() => setTheme(t)}
                    title={cfg.label}
                    style={{ "--swatch-color": cfg.accent } as React.CSSProperties}
                  >
                    <span
                      className="settings-swatch-dot"
                      style={{ background: cfg.accent }}
                    />
                    <span className="settings-swatch-name">
                      {(tr as Record<string, string>)[`theme${t.charAt(0).toUpperCase() + t.slice(1)}`] ?? cfg.label}
                    </span>
                    {active && (
                      <span className="settings-swatch-check">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Appearance ──────────────────────────────────── */}
          <div className="settings-section">
            <div className="settings-section-label">{tr.appearance}</div>
            <div className="settings-mode-row">
              {(["light", "dark"] as Mode[]).map((m) => (
                <button
                  key={m}
                  className={`settings-mode-btn ${mode === m ? "settings-mode-btn--active" : ""}`}
                  onClick={() => setMode(m)}
                >
                  {m === "light" ? <SvgSun /> : <SvgMoon />}
                  {m === "light" ? tr.light : tr.dark}
                </button>
              ))}
            </div>
          </div>

          {/* ── Language ────────────────────────────────────── */}
          <div className="settings-section">
            <div className="settings-section-label">{tr.language}</div>
            <div className="settings-lang-row">
              {LANG_OPTIONS.map((l) => (
                <button
                  key={l.code}
                  className={`settings-lang-btn ${lang === l.code ? "settings-lang-btn--active" : ""}`}
                  onClick={() => setLang(l.code)}
                >
                  <span className="settings-lang-flag">{l.flag}</span>
                  <span>{l.label}</span>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
