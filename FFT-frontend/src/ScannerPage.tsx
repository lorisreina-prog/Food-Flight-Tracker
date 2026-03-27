import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

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
        useBarCodeDetectorIfSupported: true, // native BarcodeDetector API — much faster
        verbose: false,
      });
    } catch (e) {
      setStatus("error");
      setErrorMsg("Scanner konnte nicht initialisiert werden.");
      return;
    }

    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        {
          fps: 30,                                 // high fps → faster detection
          qrbox: (w, h) => ({                      // dynamic: 90% width, 45% height
            width:  Math.round(w * 0.9),
            height: Math.round(Math.min(h * 0.45, w * 0.4)),
          }),
          aspectRatio: 1.7778,                     // 16:9 landscape stream
        },
        (decoded) => {
          if (firedRef.current) return;
          firedRef.current = true;
          scanner.stop().catch(() => {});
          // Strip any URL prefix (e.g. "https://example.com/scan/QR-001")
          const parts = decoded.split("/");
          const code = parts[parts.length - 1].trim();
          navigate(`/scan/${encodeURIComponent(code)}`);
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
      scanner.stop().catch(() => {});
    };
  }, []);

  const submitManual = () => {
    const code = manualCode.trim();
    if (!code) return;
    navigate(`/scan/${encodeURIComponent(code)}`);
  };

  return (
    <div className="scanner-page">
      <div className="scanner-header">
        <Link to="/admin" className="scanner-back">← Zurück</Link>
        <h2 className="scanner-title">Produkt scannen</h2>
      </div>

      <div className="scanner-card">
        <div id="qr-reader-region" className="qr-reader-region" />
        <div className="scanner-status">
          <span className={`scanner-dot ${status === "error" ? "scanner-error-dot" : ""}`} />
          {status === "starting" && "Kamera wird gestartet…"}
          {status === "active" && (
            <span>
              Aktiv —{" "}
              <strong>Barcode ruhig halten</strong>, parallel zur Kante ausrichten
            </span>
          )}
          {status === "error" && errorMsg}
        </div>
      </div>

      <div className="scanner-tip">
        <span>📦</span>
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
