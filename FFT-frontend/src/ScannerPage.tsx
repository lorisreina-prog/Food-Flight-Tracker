import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";

export default function ScannerPage() {
  const navigate = useNavigate();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const regionId = "qr-reader-region";
    const scanner = new Html5Qrcode(regionId);
    scannerRef.current = scanner;

    scanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => {
        scanner.stop().catch(() => {});
        const parts = decodedText.split("/");
        const code = parts[parts.length - 1];
        navigate(`/scan/${code}`);
      },
      () => {}
    ).then(() => setStarted(true)).catch(() => {
      setError("Kamera konnte nicht gestartet werden. Bitte Berechtigung prüfen.");
    });

    return () => {
      scanner.stop().catch(() => {});
    };
  }, [navigate]);

  return (
    <div className="scanner-page">
      <h2 className="scanner-title">QR-Code scannen</h2>
      {error && <p className="form-error">{error}</p>}
      <div id="qr-reader-region" ref={containerRef} className="qr-reader-region" />
      {!started && !error && <p className="scanner-hint">Kamera wird gestartet…</p>}
    </div>
  );
}
