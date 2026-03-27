import { useState } from "react";
import { api } from "./api";

interface Props {
  batchId: number;
  userToken: string;
}

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
      if (err?.status === 400) {
        setAlreadyRated(true);
      } else {
        setError("Bewertung konnte nicht gespeichert werden. Bitte erneut versuchen.");
      }
    }
  };

  if (submitted) {
    return (
      <div className="card crowd-card">
        <p className="crowd-thanks">Danke für deine Bewertung! ⭐</p>
      </div>
    );
  }

  if (alreadyRated) {
    return (
      <div className="card crowd-card">
        <p className="crowd-already-rated">Du hast dieses Produkt bereits bewertet.</p>
      </div>
    );
  }

  return (
    <div className="card crowd-card">
      <h3 className="card-title">Produkt bewerten</h3>
      <div className="stars-row">
        {[1, 2, 3, 4, 5].map((s) => (
          <span
            key={s}
            className="star"
            style={{ color: s <= (hover || stars) ? "#F59E0B" : "#d1d5db", cursor: "pointer", fontSize: 28 }}
            onMouseEnter={() => setHover(s)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setStars(s)}
          >
            ★
          </span>
        ))}
      </div>
      <textarea
        className="crowd-comment"
        placeholder="Kommentar (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
      />
      {error && <p className="form-error">{error}</p>}
      <button className="btn-primary" onClick={submit} disabled={!stars}>
        Bewertung abschicken
      </button>
    </div>
  );
}
