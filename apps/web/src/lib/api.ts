const API_BASE = "/api";

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function apiPut<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function apiDelete<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

function getToken(): string {
  return localStorage.getItem("stirling-token") || "";
}

export function setToken(token: string) {
  localStorage.setItem("stirling-token", token);
}

export function clearToken() {
  localStorage.removeItem("stirling-token");
}

// ── File Upload / Download ──────────────────────────────────────

export async function apiUpload(
  files: File[],
): Promise<{
  jobId: string;
  files: Array<{ name: string; size: number; format: string }>;
}> {
  const formData = new FormData();
  files.forEach((f) => formData.append("files", f));
  const res = await fetch("/api/v1/upload", {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
    body: formData,
  });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  return res.json();
}

export function getDownloadUrl(jobId: string, filename: string): string {
  return `/api/v1/download/${jobId}/${filename}`;
}

export async function apiDownloadBlob(
  jobId: string,
  filename: string,
): Promise<Blob> {
  const res = await fetch(getDownloadUrl(jobId, filename), {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  return res.blob();
}
