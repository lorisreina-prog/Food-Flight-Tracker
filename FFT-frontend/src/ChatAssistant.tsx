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
        <span style={{ fontSize: 18 }}>💬</span>
        <span>Produkt-Assistent</span>
        <span style={{ marginLeft: "auto", fontSize: 11, opacity: .6 }}>{open ? "▲" : "▼"}</span>
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
              ↑
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
