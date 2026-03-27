import { useState } from "react";
import { api } from "./api";

interface Props {
  batchId: number;
}

const CATEGORIES = ["Qualität", "Sicherheit", "Allergene", "Verpackung", "Kennzeichnung", "Sonstiges"];

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
      if (err?.status === 429) {
        setError("Zu viele Beanstandungen. Bitte später erneut versuchen.");
      } else {
        setError("Beanstandung konnte nicht übermittelt werden.");
      }
    }
  };

  return (
    <div className="card complaint-card">
      <button className="complaint-toggle" onClick={() => setOpen((o) => !o)}>
        Produkt beanstanden {open ? "▲" : "▼"}
      </button>
      {open && (
        submitted ? (
          <p className="complaint-thanks">Beanstandung eingereicht. Danke!</p>
        ) : (
          <form className="complaint-form" onSubmit={submit}>
            <input className="form-input" placeholder="Name *" value={name} onChange={(e) => setName(e.target.value)} />
            <input className="form-input" placeholder="E-Mail (optional)" value={email} onChange={(e) => setEmail(e.target.value)} />
            <select className="form-input" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <textarea className="form-input" placeholder="Beschreibung *" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
            {error && <p className="form-error">{error}</p>}
            <button className="btn-danger" type="submit">Absenden</button>
          </form>
        )
      )}
    </div>
  );
}
