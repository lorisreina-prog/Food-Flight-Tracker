import { useState, useRef, useEffect } from "react";
import { api } from "./api";
import type { ChatMessage } from "./types";

interface Props {
  batch_id?: number;
  batchId?: number;
  product_name?: string;
  sessionId?: string;
}

const STARTERS = [
  "Woher kommt dieses Produkt?",
  "Ist es sicher zu essen?",
  "Was sind die Inhaltsstoffe?",
  "Wie nachhaltig ist es?",
];

const SvgMessageCircle = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const SvgChevronUp = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="18 15 12 9 6 15" />
  </svg>
);

const SvgChevronDown = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const SvgSend = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

export default function ChatAssistant({ batch_id, batchId, product_name }: Props) {
  const resolvedId = batch_id ?? batchId ?? 0;
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const sessionId = useRef(crypto.randomUUID());
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }, [messages, open]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setLoading(true);
    try {
      const res = await api.sendChat(resolvedId, trimmed, sessionId.current);
      setMessages((prev) => [...prev, { role: "assistant", content: res.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Fehler beim Senden. Bitte erneut versuchen." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card chat-card">
      <button className="chat-toggle" onClick={() => setOpen((o) => !o)}>
        <SvgMessageCircle />
        <span>Produkt-Assistent</span>
        <span style={{ marginLeft: "auto", opacity: .5 }}>{open ? <SvgChevronUp /> : <SvgChevronDown />}</span>
      </button>

      {!open && (
        <p className="chat-hint">„{STARTERS[0]}"</p>
      )}

      {open && (
        <div className="chat-body">
          {product_name && (
            <p className="chat-context-label">Fragen zu: <strong>{product_name}</strong></p>
          )}

          {messages.length === 0 && (
            <div className="chat-starters">
              {STARTERS.map((q) => (
                <button key={q} className="chat-starter-chip" onClick={() => send(q)}>
                  {q}
                </button>
              ))}
            </div>
          )}

          <div className="chat-messages">
            {messages.map((m, i) => (
              <div key={i} className={`chat-msg chat-msg--${m.role}`}>
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="chat-msg chat-msg--assistant chat-typing">
                <span className="chat-dot" /><span className="chat-dot" /><span className="chat-dot" />
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="chat-input-row">
            <input
              className="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send(input)}
              placeholder="Frage stellen…"
              disabled={loading}
            />
            <button
              className="chat-send-btn"
              onClick={() => send(input)}
              disabled={loading || !input.trim()}
            >
              <SvgSend />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
