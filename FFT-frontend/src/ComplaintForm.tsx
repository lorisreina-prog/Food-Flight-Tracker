import { useState } from "react";
import { api } from "./api";

interface Props {
  batchId: number;
}

const CATEGORIES = ["Qualität", "Sicherheit", "Allergene", "Verpackung", "Kennzeichnung", "Sonstiges"];

const SvgAlertTriangle = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const SvgCheckCircle = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const SvgChevronUp = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="18 15 12 9 6 15" />
  </svg>
);

const SvgChevronDown = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

export default function ComplaintForm({ batchId }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) {
      setError("Name und Beschreibung sind erforderlich.");
      return;
    }
    setError("");
    try {
      await api.submitComplaint(batchId, name, email, description, category);
      setSubmitted(true);
    } catch (err: any) {
      if (err?.status === 429) setError("Zu viele Beanstandungen. Bitte später erneut versuchen.");
      else setError("Beanstandung konnte nicht übermittelt werden.");
    }
  };

  return (
    <div className="card">
      <button className="complaint-toggle" onClick={() => setOpen((o) => !o)}>
        <SvgAlertTriangle />
        Produkt beanstanden
        <span style={{ marginLeft: "auto", opacity: .5 }}>{open ? <SvgChevronUp /> : <SvgChevronDown />}</span>
      </button>

      {open && (
        submitted ? (
          <div className="complaint-thanks">
            <SvgCheckCircle />
            Beanstandung eingereicht. Vielen Dank.
          </div>
        ) : (
          <form className="complaint-form" onSubmit={submit}>
            <input className="form-input" placeholder="Name *" value={name} onChange={(e) => setName(e.target.value)} />
            <input className="form-input" placeholder="E-Mail (optional)" value={email} onChange={(e) => setEmail(e.target.value)} />
            <select className="form-input" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <textarea className="form-input" placeholder="Beschreibung *" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
            {error && (
              <p className="form-error">
                <SvgAlertTriangle />
                {error}
              </p>
            )}
            <button className="btn-danger" type="submit">Absenden</button>
          </form>
        )
      )}
    </div>
  );
}
