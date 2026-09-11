import { getSession, destroySession } from "./session";

export class WordPressApiError extends Error {
  status: number;
  data?: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = "WordPressApiError";
    this.status = status;
    this.data = data;
  }
}

export async function getWordPressBaseUrlForSession(): Promise<string> {
  return (
    process.env.WOWCAR_WORDPRESS_URL || "https://staging.wowcar.co.th/wp-json"
  ).replace(/\/+$/, "");
}

/**
  Central URL builder ensuring a unique nocache query parameter is added.
 */
export async function buildWpUrl(endpoint: string): Promise<string> {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const baseUrl = await getWordPressBaseUrlForSession();
  const fullUrlString = `${baseUrl}${cleanEndpoint}`;
  const parsedUrl = new URL(fullUrlString);
  parsedUrl.searchParams.set("nocache", Date.now().toString());
  return parsedUrl.toString();
}

/**
  Builds mandatory server-to-server request headers with strict no-cache control.
 */
async function getAuthHeaders(isPost: boolean = false): Promise<Record<string, string>> {
  const session = await getSession();
  const token = session?.portalToken;

  if (!token) {
    throw new WordPressApiError("No active administrator session token found.", 401);
  }

  const headers: Record<string, string> = {
    "Authorization": `Bearer ${token}`,
    "X-WowCar-Portal-Token": token,
    "Accept": "application/json",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Pragma": "no-cache",
  };

  if (isPost) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
}

/**
  Defensive response handler validating Content-Type header before parsing JSON.
 */
async function handleWpResponse<T>(res: Response): Promise<T> {
  if (res.status === 401 || res.status === 403) {
    await destroySession();
    throw new WordPressApiError("Invalid or expired administrator token. Please log in again.", res.status);
  }

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.toLowerCase().includes("application/json");

  if (!isJson) {
    throw new WordPressApiError(
      "Server REST API returned HTML instead of JSON. A cache or maintenance layer may have intercepted the REST request.",
      502
    );
  }

  const responseText = await res.text();
  let data: any;
  try {
    data = JSON.parse(responseText);
  } catch (_) {
    throw new WordPressApiError(
      "Server REST API returned malformed JSON response.",
      502
    );
  }

  if (!res.ok) {
    const errorMsg = data?.message || data?.error || `Server REST API error ${res.status}: ${res.statusText}`;
    throw new WordPressApiError(errorMsg, res.status, data);
  }

  return data as T;
}

/**
  Central GET helper for /wp-json/wowcar-admin/v1/* and /wp-json/wowcar/v1/*
 */
export async function wordpressAdminGet<T>(endpoint: string): Promise<T> {
  const headers = await getAuthHeaders(false);
  const url = await buildWpUrl(endpoint);

  try {
    const res = await fetch(url, {
      method: "GET",
      headers,
      cache: "no-store",
      next: { revalidate: 0 },
    });

    return await handleWpResponse<T>(res);
  } catch (error: any) {
    if (error instanceof WordPressApiError) throw error;
    throw new WordPressApiError(error.message || "Failed to communicate with server REST API.", 500);
  }
}

/**
  Central POST helper for /wp-json/wowcar-admin/v1/* and /wp-json/wowcar/v1/*
 */
export async function wordpressAdminPost<T>(endpoint: string, body?: any): Promise<T> {
  const headers = await getAuthHeaders(true);
  const url = await buildWpUrl(endpoint);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
      next: { revalidate: 0 },
    });

    return await handleWpResponse<T>(res);
  } catch (error: any) {
    if (error instanceof WordPressApiError) throw error;
    throw new WordPressApiError(error.message || "Failed to communicate with server REST API.", 500);
  }
}

/**
  Central POST helper for multipart/form-data requests.
 */
export async function wordpressAdminPostFormData<T>(endpoint: string, formData: FormData): Promise<T> {
  const headers = await getAuthHeaders(false);
  const url = await buildWpUrl(endpoint);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: formData,
      cache: "no-store",
      next: { revalidate: 0 },
    });

    return await handleWpResponse<T>(res);
  } catch (error: any) {
    if (error instanceof WordPressApiError) throw error;
    throw new WordPressApiError(error.message || "Failed to communicate with server REST API.", 500);
  }
}

/**
  Central DELETE helper for /wp-json/wowcar-admin/v1/* and /wp-json/wowcar/v1/*
 */
export async function wordpressAdminDelete<T>(endpoint: string): Promise<T> {
  const headers = await getAuthHeaders(false);
  const url = await buildWpUrl(endpoint);

  try {
    const res = await fetch(url, {
      method: "DELETE",
      headers,
      cache: "no-store",
      next: { revalidate: 0 },
    });

    return await handleWpResponse<T>(res);
  } catch (error: any) {
    if (error instanceof WordPressApiError) throw error;
    throw new WordPressApiError(error.message || "Failed to communicate with server REST API.", 500);
  }
}
