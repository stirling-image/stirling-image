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

// ── Persistent File Management ──────────────────────────────────

export interface UserFile {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  version: number;
  toolChain: string[];
  createdAt: string;
}

export interface UserFileDetail extends UserFile {
  versions: Array<{
    id: string;
    version: number;
    size: number;
    toolChain: string[];
    createdAt: string;
  }>;
}

export async function apiListFiles(params?: {
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ files: UserFile[]; total: number }> {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.set("search", params.search);
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.offset) searchParams.set("offset", String(params.offset));
  const qs = searchParams.toString();
  return apiGet(`/v1/files${qs ? `?${qs}` : ""}`);
}

export async function apiGetFileDetails(id: string): Promise<UserFileDetail> {
  return apiGet(`/v1/files/${id}`);
}

export async function apiUploadUserFiles(
  files: File[],
): Promise<{ files: Array<{ id: string; originalName: string; size: number; version: number }> }> {
  const formData = new FormData();
  files.forEach((f) => formData.append("files", f));
  const res = await fetch("/api/v1/files/upload", {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
    body: formData,
  });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  return res.json();
}

export async function apiDeleteUserFiles(ids: string[]): Promise<{ deleted: number }> {
  const res = await fetch("/api/v1/files", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ ids }),
  });
  if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
  return res.json();
}

export function getFileThumbnailUrl(id: string): string {
  return `/api/v1/files/${id}/thumbnail`;
}

export function getFileDownloadUrl(id: string): string {
  return `/api/v1/files/${id}/download`;
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
