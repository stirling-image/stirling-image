import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return false;
  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 0) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a === 192 && b === 0 && parts[2] === 0) return true;
  if (a === 198 && (b === 18 || b === 19)) return true;
  if (a >= 240) return true;
  return false;
}

function isPrivateIPv6(ip: string): boolean {
  const normalized = ip.replace(/^\[|]$/g, "").toLowerCase();
  if (normalized === "::1") return true;
  if (normalized === "::") return true;
  if (normalized.startsWith("fe80:")) return true;
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
  if (normalized.startsWith("2001:db8:")) return true;
  if (normalized.includes("::ffff:")) {
    const v4 = normalized.split("::ffff:")[1];
    if (v4 && isPrivateIPv4(v4)) return true;
  }
  return false;
}

async function resolveAndCheck(hostname: string): Promise<void> {
  const bare = hostname.replace(/^\[|]$/g, "");
  if (isIP(bare)) {
    if (isPrivateIPv4(bare) || isPrivateIPv6(bare)) {
      throw new Error("URL resolves to a private or reserved IP address");
    }
    return;
  }

  const result = await lookup(hostname, { all: true });
  const addresses = Array.isArray(result) ? result : [result];
  for (const entry of addresses) {
    const addr = entry.address;
    if (isPrivateIPv4(addr) || isPrivateIPv6(addr)) {
      throw new Error("URL resolves to a private or reserved IP address");
    }
  }
}

export async function validateFetchUrl(url: string): Promise<void> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Invalid URL");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only HTTP and HTTPS URLs are supported");
  }

  await resolveAndCheck(parsed.hostname);
}

export const MAX_REDIRECTS = 5;
export const FETCH_TIMEOUT_MS = 30_000;
export const MAX_URL_FETCH_SIZE = 50 * 1024 * 1024;
export const MAX_URLS_PER_REQUEST = 50;
export const URL_FETCH_CONCURRENCY = 4;

export async function safeFetch(url: string, signal?: AbortSignal): Promise<Response> {
  let currentUrl = url;
  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    await validateFetchUrl(currentUrl);
    const res = await fetch(currentUrl, {
      signal,
      redirect: "manual",
      headers: { "User-Agent": "SnapOtter/1.0 (image-fetch)" },
    });

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) throw new Error("Redirect without Location header");
      await res.body?.cancel();
      currentUrl = new URL(location, currentUrl).href;
      continue;
    }

    return res;
  }
  throw new Error("Too many redirects");
}
