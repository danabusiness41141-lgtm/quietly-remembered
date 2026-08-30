const KEY = "qr-anonymous-key";

export function getAnonymousKey() {
  const existing = localStorage.getItem(KEY);
  if (existing) return existing;
  const value = `${crypto.randomUUID()}-${crypto.randomUUID()}`;
  localStorage.setItem(KEY, value);
  return value;
}
