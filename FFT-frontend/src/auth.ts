interface Account {
  username: string;
  password: string;
  createdAt: string;
}

const ACCOUNTS_KEY = "fft_accounts";
const SESSION_KEY = "fft_auth";

function loadAccounts(): Account[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAccounts(accounts: Account[]) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function register(username: string, password: string): { ok: true } | { ok: false; error: string } {
  const trimmed = username.trim().toLowerCase();
  if (trimmed.length < 3) return { ok: false, error: "Benutzername muss mindestens 3 Zeichen lang sein." };
  if (password.length < 6) return { ok: false, error: "Passwort muss mindestens 6 Zeichen lang sein." };

  const accounts = loadAccounts();
  if (accounts.some((a) => a.username === trimmed)) {
    return { ok: false, error: "Dieser Benutzername ist bereits vergeben." };
  }

  accounts.push({ username: trimmed, password, createdAt: new Date().toISOString() });
  saveAccounts(accounts);
  return { ok: true };
}

export function login(username: string, password: string): { ok: true; username: string } | { ok: false; error: string } {
  const trimmed = username.trim().toLowerCase();
  if (!trimmed || !password) return { ok: false, error: "Bitte alle Felder ausfüllen." };

  const accounts = loadAccounts();
  const account = accounts.find((a) => a.username === trimmed && a.password === password);
  if (!account) return { ok: false, error: "Benutzername oder Passwort ist falsch." };

  localStorage.setItem(SESSION_KEY, JSON.stringify({ username: account.username, loggedIn: true }));
  return { ok: true, username: account.username };
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

export function getSession(): { username: string } | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed.loggedIn ? { username: parsed.username } : null;
  } catch {
    return null;
  }
}

export function hasAnyAccount(): boolean {
  return loadAccounts().length > 0;
}
