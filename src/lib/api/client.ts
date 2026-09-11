const USE_MOCK_API = process.env.NEXT_PUBLIC_USE_MOCK_API === "true";

function getBaseApiPrefix(): string {
  if (typeof window !== "undefined") {
    if (window.location.pathname.startsWith("/dealer")) return "/api/dealer";
    if (window.location.pathname.startsWith("/admin")) return "/api/admin";
  }
  return "/api/admin"; // SSR fallback
}

export async function fetchApi<T>(endpoint: string, options?: RequestInit, fallbackData?: T): Promise<T> {
  const isBffRoute = endpoint.startsWith("/api/");
  const url = isBffRoute ? endpoint : `${getBaseApiPrefix()}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (res.status === 401 || res.status === 403) {
      if (typeof window !== "undefined") {
        const isDealer = window.location.pathname.startsWith("/dealer");
        const loginPath = isDealer ? "/dealer/login" : "/admin/login";
        if (!window.location.pathname.startsWith(loginPath)) {
          window.location.href = loginPath;
        }
      }
    }

    const text = await res.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch (_) {
      if (USE_MOCK_API && fallbackData !== undefined) {
        return fallbackData;
      }
      if (!res.ok) {
        throw new Error(`API error ${res.status}: ${res.statusText}`);
      }
      throw new Error("Received non-JSON response from server.");
    }

    if (!res.ok) {
      if (USE_MOCK_API && fallbackData !== undefined) {
        return fallbackData;
      }
      throw new Error(data?.error || data?.message || `API error ${res.status}: ${res.statusText}`);
    }

    return data as T;
  } catch (error) {
    if (USE_MOCK_API && fallbackData !== undefined) {
      return fallbackData;
    }
    throw error;
  }
}
