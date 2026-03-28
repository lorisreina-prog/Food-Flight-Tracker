import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import Logo from "./Logo";
import { useSettings } from "./SettingsContext";
import { getT } from "./i18n";
import type { Lang } from "./i18n";

const FORMATS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.QR_CODE,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.ITF,
  Html5QrcodeSupportedFormats.DATA_MATRIX,
  Html5QrcodeSupportedFormats.PDF_417,
];

const IconArrowLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const IconBarcode = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 5v14M8 5v14M13 5v14M18 5v14M21 5v14" />
  </svg>
);

const DISCOVER_ITEMS: Record<Lang, string[]> = {
  de: ["Herkunft", "Charge", "Rückrufe", "Risikobewertung", "Lieferkette", "Nachhaltigkeit", "Zertifikate"],
  en: ["Origin", "Batch", "Recalls", "Risk Score", "Supply Chain", "Sustainability", "Certificates"],
  fr: ["Origine", "Lot", "Rappels", "Risque", "Chaîne logistique", "Durabilité", "Certificats"],
};

const IconSettings = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

export default function ScannerPage() {
  const navigate = useNavigate();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const firedRef = useRef(false);
  const [status, setStatus] = useState<"starting" | "active" | "error">("starting");
  const [errorMsg, setErrorMsg] = useState("");
  const [manualCode, setManualCode] = useState("");
  const { lang, openPanel } = useSettings();
  const tr = getT(lang);

  useEffect(() => {
    const regionId = "qr-reader-region";

    const el = document.getElementById(regionId);
    if (el) el.innerHTML = "";

    let scanner: Html5Qrcode;
    try {
      scanner = new Html5Qrcode(regionId, {
        formatsToSupport: FORMATS,
        useBarCodeDetectorIfSupported: true,
        verbose: false,
      });
    } catch {
      setStatus("error");
      setErrorMsg(tr.scannerInitError);
      return;
    }

    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        {
          fps: 30,
          qrbox: (w, h) => ({
            width: Math.round(w * 0.9),
            height: Math.round(Math.min(h * 0.45, w * 0.4)),
          }),
          aspectRatio: 1.7778,
        },
        (decoded) => {
          if (firedRef.current) return;
          firedRef.current = true;
          const parts = decoded.split("/");
          const code = parts[parts.length - 1].trim();
          scanner
            .stop()
            .catch(() => {})
            .finally(() => navigate(`/scan/${encodeURIComponent(code)}`));
        },
        () => {}
      )
      .then(() => setStatus("active"))
      .catch((err) => {
        console.error("Scanner error:", err);
        setStatus("error");
        setErrorMsg(tr.cameraUnavailable);
      });

    return () => {
      if (!firedRef.current) {
        scanner.stop().catch(() => {});
      }
    };
  }, []);

  const submitManual = () => {
    const code = manualCode.trim();
    if (!code) return;
    setTimeout(() => navigate(`/scan/${encodeURIComponent(code)}`), 0);
  };

  return (
    <div className="scanner-page">
      <div className="scanner-header">
        <Link to="/admin" className="scanner-back">
          <IconArrowLeft />
          {tr.back}
        </Link>
        <div className="scanner-brand">
          <Logo size={28} />
          <span className="scanner-brand-name">FoodTrace</span>
          <button className="settings-gear-inline" style={{ marginLeft: 4 }} onClick={openPanel} aria-label={tr.settings}><IconSettings /></button>
        </div>
      </div>
      <h2 className="scanner-title">{tr.scanTitle}</h2>
      <p style={{ margin: "-4px 0 12px", fontSize: 13, color: "var(--tx-3)", textAlign: "center" }}>
        {tr.scanSubtitle}
      </p>

      <div className="scanner-card">
        <div id="qr-reader-region" className="qr-reader-region" />
        <div className="scanner-status">
          <span className={`scanner-dot ${status === "error" ? "scanner-error-dot" : ""}`} />
          {status === "starting" && tr.cameraStarting}
          {status === "active" && (
            <span>
              {tr.cameraActive}
            </span>
          )}
          {status === "error" && errorMsg}
        </div>
      </div>

      <div className="scanner-tip">
        <IconBarcode />
        <span>EAN-13 · EAN-8 · QR-Code · CODE-128 · UPC · PDF-417</span>
      </div>

      <div className="scanner-divider">
        <div className="scanner-divider-line" />
        <span className="scanner-divider-text">{tr.orManual}</span>
        <div className="scanner-divider-line" />
      </div>

      <div className="scanner-manual">
        <h3>{tr.manualEntry}</h3>
        <div className="scanner-manual-row">
          <input
            className="scanner-manual-input"
            placeholder="z.B. 7640150491254 oder LOT2024-B03"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitManual()}
            autoComplete="off"
          />
          <button className="scanner-manual-btn" onClick={submitManual}>
            {tr.search}
          </button>
        </div>
      </div>

      <div style={{
        margin: "20px 0 8px",
        padding: "14px 16px",
        background: "var(--surface-2)",
        border: "1px solid var(--border)",
        borderRadius: 10,
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--tx-3)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {tr.discoverTitle}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {(DISCOVER_ITEMS[lang] ?? DISCOVER_ITEMS.de).map((item) => (
            <span key={item} style={{
              padding: "3px 10px",
              background: "var(--accent-lt)",
              color: "var(--accent)",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 600,
            }}>
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
