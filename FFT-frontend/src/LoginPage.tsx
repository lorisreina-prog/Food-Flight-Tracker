import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "./auth";
import Logo from "./Logo";
import { useSettings } from "./SettingsContext";
import { getT } from "./i18n";

const IconInfo = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const IconEye = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconEyeOff = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { lang } = useSettings();
  const tr = getT(lang);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isValidEmail(email)) {
      setError(tr.invalidEmail);
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.ok) {
      navigate("/admin");
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <Logo size={44} />
          <span className="auth-brand-name">FoodTrace</span>
        </div>

        <div className="auth-heading">
          <h1>{tr.welcomeBack}</h1>
          <p>{tr.signInDesc}</p>
        </div>

        <form onSubmit={handleLogin} className="auth-form">
          <div className="auth-field">
            <label className="auth-label">{tr.emailLabel}</label>
            <input
              className="form-input"
              type="email"
              placeholder={tr.emailPlaceholder}
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              autoFocus
              autoComplete="email"
              disabled={loading}
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">{tr.passwordLabel}</label>
            <div className="auth-password-wrap">
              <input
                className="form-input auth-password-input"
                type={showPassword ? "text" : "password"}
                placeholder={tr.passwordPlaceholder}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                className="auth-eye-btn"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
              >
                {showPassword ? <IconEyeOff /> : <IconEye />}
              </button>
            </div>
          </div>

          {error && (
            <div className="auth-error">
              <IconInfo />
              {error}
            </div>
          )}

          <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: 4 }}>
            {loading ? tr.signingIn : tr.signIn}
          </button>
        </form>

        <div className="auth-switch">
          {tr.noAccount}{" "}
          <Link to="/register" className="auth-switch-link">
            {tr.createAccountLink}
          </Link>
        </div>
      </div>
    </div>
  );
}
