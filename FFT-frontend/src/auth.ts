const BASE = import.meta.env.VITE_API_URL ?? "";
const SESSION_KEY = "fft_auth";

async function apiPost(path: string, body: object): Promise<{ ok: boolean; email?: string; error?: string }> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const data = await res.json();
      return { ok: true, email: data.email };
    }
    const err = await res.json().catch(() => ({ detail: "Unbekannter Fehler." }));
    return { ok: false, error: err.detail ?? "Unbekannter Fehler." };
  } catch {
    return { ok: false, error: "Server nicht erreichbar." };
  }
}

export async function register(email: string, password: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const result = await apiPost("/api/auth/register", { email, password });
  if (!result.ok) return { ok: false, error: result.error! };
  return { ok: true };
}

export async function login(email: string, password: string): Promise<{ ok: true; email: string } | { ok: false; error: string }> {
  const result = await apiPost("/api/auth/login", { email, password });
  if (!result.ok) return { ok: false, error: result.error! };
  localStorage.setItem(SESSION_KEY, JSON.stringify({ email: result.email, loggedIn: true }));
  return { ok: true, email: result.email! };
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

export function isLoggedIn(): boolean {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw).loggedIn === true : false;
  } catch {
    return false;
  }
}

export function getSession(): { email: string } | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed.loggedIn ? { email: parsed.email } : null;
  } catch {
    return null;
  }
}
