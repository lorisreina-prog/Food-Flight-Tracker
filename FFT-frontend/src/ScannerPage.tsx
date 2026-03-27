import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import Logo from "./Logo";

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

export default function ScannerPage() {
  const navigate = useNavigate();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const firedRef = useRef(false);
  const [status, setStatus] = useState<"starting" | "active" | "error">("starting");
  const [errorMsg, setErrorMsg] = useState("");
  const [manualCode, setManualCode] = useState("");

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
      setErrorMsg("Scanner konnte nicht initialisiert werden.");
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
        setErrorMsg("Kamera nicht verfügbar — Berechtigung prüfen oder Code manuell eingeben.");
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
          Zurück
        </Link>
        <div className="scanner-brand">
          <Logo size={28} />
          <span className="scanner-brand-name">FoodTrace</span>
        </div>
      </div>
      <h2 className="scanner-title">Produkt scannen</h2>

      <div className="scanner-card">
        <div id="qr-reader-region" className="qr-reader-region" />
        <div className="scanner-status">
          <span className={`scanner-dot ${status === "error" ? "scanner-error-dot" : ""}`} />
          {status === "starting" && "Kamera wird gestartet…"}
          {status === "active" && (
            <span>
              Aktiv — <strong>Barcode ruhig halten</strong>, parallel zur Kante ausrichten
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
        <span className="scanner-divider-text">oder manuell eingeben</span>
        <div className="scanner-divider-line" />
      </div>

      <div className="scanner-manual">
        <h3>Barcode-Nummer eingeben</h3>
        <div className="scanner-manual-row">
          <input
            className="scanner-manual-input"
            placeholder="z.B. 7640150491254"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitManual()}
            inputMode="numeric"
            autoComplete="off"
          />
          <button className="scanner-manual-btn" onClick={submitManual}>
            Suchen
          </button>
        </div>
      </div>
    </div>
  );
}
