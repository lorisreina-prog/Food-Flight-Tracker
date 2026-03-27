import { useState } from "react";
import { api } from "./api";

interface Props {
  batchId: number;
  userToken: string;
}

const SvgCheckCircle = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const SvgAlertTriangle = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

export default function CrowdRating({ batchId, userToken }: Props) {
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [alreadyRated, setAlreadyRated] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!stars) return;
    setError("");
    try {
      await api.submitCrowdRating(batchId, stars, comment, userToken);
      setSubmitted(true);
    } catch (err: any) {
      if (err?.status === 400) setAlreadyRated(true);
      else setError("Bewertung konnte nicht gespeichert werden. Bitte erneut versuchen.");
    }
  };

  if (submitted) {
    return (
      <div className="card">
        <div className="crowd-thanks">
          <SvgCheckCircle />
          Danke für deine Bewertung!
        </div>
      </div>
    );
  }

  if (alreadyRated) {
    return (
      <div className="card">
        <p className="crowd-already-rated">Du hast dieses Produkt bereits bewertet.</p>
      </div>
    );
  }

  const active = hover || stars;

  return (
    <div className="card">
      <h3 className="card-title">Produkt bewerten</h3>
      <div className="stars-row">
        {[1,2,3,4,5].map((s) => (
          <span
            key={s}
            style={{
              color: s <= active ? "#F59E0B" : "#D1D5DB",
              cursor: "pointer", fontSize: 32,
              transition: "color .1s, transform .1s",
              transform: s <= active ? "scale(1.1)" : "scale(1)",
              display: "inline-block",
            }}
            onMouseEnter={() => setHover(s)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setStars(s)}
          >
            ★
          </span>
        ))}
      </div>
      {stars > 0 && (
        <textarea
          className="crowd-comment"
          placeholder="Kommentar (optional)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={2}
        />
      )}
      {error && (
        <p className="form-error">
          <SvgAlertTriangle />
          {error}
        </p>
      )}
      <button className="btn-primary" onClick={submit} disabled={!stars}>
        Bewertung abschicken
      </button>
    </div>
  );
}
