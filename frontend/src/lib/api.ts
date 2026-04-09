const API_BASE = "/api";

type FetchOptions = RequestInit & { skipAuth?: boolean };

function getToken(): string | null {
  return localStorage.getItem("accessToken");
}

export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("refreshToken", refreshToken);
}

export function clearTokens() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    setTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  } catch {
    return null;
  }
}

export async function api<T = unknown>(path: string, options: FetchOptions = {}): Promise<T> {
  const { skipAuth, ...fetchOptions } = options;
  const headers = new Headers(fetchOptions.headers);

  if (!skipAuth) {
    const token = getToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  if (!headers.has("Content-Type") && !(fetchOptions.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${API_BASE}${path}`, { ...fetchOptions, headers });

  if (res.status === 401 && !skipAuth) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers.set("Authorization", `Bearer ${newToken}`);
      const retryRes = await fetch(`${API_BASE}${path}`, { ...fetchOptions, headers });
      if (!retryRes.ok) {
        const err = await retryRes.json().catch(() => ({ error: "Erreur inconnue" }));
        throw new Error(err.error || `HTTP ${retryRes.status}`);
      }
      return retryRes.json();
    }
    clearTokens();
    window.location.href = "/login";
    throw new Error("Session expirée");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Erreur inconnue" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}
