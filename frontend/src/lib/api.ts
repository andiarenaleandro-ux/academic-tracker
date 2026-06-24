const BASE_URL = "/api";

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json();
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let detail = `POST ${path} failed: ${res.status}`;
    try { const j = await res.json(); if (j.detail) detail = String(j.detail); } catch {}
    throw new Error(detail);
  }
  return res.json();
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PATCH ${path} failed: ${res.status}`);
  return res.json();
}

export async function apiDelete(path: string): Promise<void> {
  const res = await fetch(`${BASE_URL}${path}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`DELETE ${path} failed: ${res.status}`);
}
