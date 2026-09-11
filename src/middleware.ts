import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ── Edge-compatible session decrypt (crypto.subtle / AES-256-GCM) ──────────
const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  "wowcar_super_secret_admin_session_key_32chars_min!";

async function getKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const raw = await crypto.subtle.digest("SHA-256", enc.encode(SESSION_SECRET));
  return crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, ["decrypt"]);
}

async function decryptSession(token: string): Promise<Record<string, unknown> | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [ivB64, tagB64, encB64] = parts;
    const iv = Uint8Array.from(atob(ivB64), (c) => c.charCodeAt(0));
    const tag = Uint8Array.from(atob(tagB64), (c) => c.charCodeAt(0));
    const enc = Uint8Array.from(atob(encB64), (c) => c.charCodeAt(0));
    // AES-GCM: ciphertext + auth tag concatenated
    const combined = new Uint8Array(enc.length + tag.length);
    combined.set(enc);
    combined.set(tag, enc.length);
    const key = await getKey();
    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, combined);
    return JSON.parse(new TextDecoder().decode(decrypted));
  } catch {
    return null;
  }
}
// ────────────────────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public assets and dedicated auth API endpoints bypass session check
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/dealer/auth") ||
    pathname.startsWith("/api/admin/auth") ||
    pathname === "/favicon.ico" ||
    /\.(png|jpg|jpeg|svg|css|js|ico|webp|woff2?)$/i.test(pathname)
  ) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get("wowcar_admin_session");
  let isDealer = false;
  let isAdmin = false;
  if (sessionCookie?.value) {
    const sessionData = await decryptSession(sessionCookie.value);
    isDealer =
      sessionData?.portal === "dealer" &&
      !!sessionData?.dealerAccessToken;
    isAdmin =
      sessionData?.portal === "admin" &&
      !!sessionData?.portalToken;
  }

  const isAuthenticated = isDealer || isAdmin;
  const defaultAuthHome = isDealer ? "/dealer" : "/admin";

  // Redirect / to /dealer/login (unauthenticated) or /dealer | /admin (authenticated)
  if (pathname === "/") {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL(defaultAuthHome, request.url));
    }
    return NextResponse.redirect(new URL("/dealer/login", request.url));
  }

  // Redirect /login to /dealer/login (unauthenticated) or /dealer | /admin (authenticated)
  if (pathname === "/login") {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL(defaultAuthHome, request.url));
    }
    return NextResponse.redirect(new URL("/dealer/login", request.url));
  }

  // Public login routes: /admin/login and /dealer/login
  if (
    pathname === "/admin/login" ||
    pathname === "/dealer/login"
  ) {
    return NextResponse.next();
  }

  // If user is accessing protected portal route and is NOT authenticated
  if (!isAuthenticated) {
    if (pathname.startsWith("/admin") || pathname.startsWith("/admin/")) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    if (pathname.startsWith("/dealer") || pathname.startsWith("/dealer/")) {
      return NextResponse.redirect(new URL("/dealer/login", request.url));
    }
  }

  // If authenticated user visits legacy un-prefixed routes (/vehicles, /users, etc.), redirect to /dealer/* or /admin/*
  const legacyRoutes = [
    "/vehicles",
    "/listings/create",
    "/users",
    "/settings",
    "/notifications",
    "/send",
    "/analytics",
    "/alerts",
    "/logs",
    "/templates",
    "/automation",
    "/campaigns",
    "/audience",
  ];
  const matchingLegacy = legacyRoutes.find(
    (r) => pathname === r || pathname.startsWith(`${r}/`)
  );
  if (matchingLegacy) {
    const targetPrefix = isDealer ? "/dealer" : "/admin";
    return NextResponse.redirect(new URL(`${targetPrefix}${pathname}`, request.url));
  }

  // Route Isolation for Authenticated Users
  if (isAuthenticated) {
    if (isDealer) {
      // Dealer trying to access /admin or /admin/*
      if (pathname === "/admin" || pathname.startsWith("/admin/")) {
        return NextResponse.redirect(new URL("/dealer", request.url));
      }
    }

    if (isAdmin) {
      // Super Admin trying to access /dealer or /dealer/*
      if (pathname === "/dealer" || pathname.startsWith("/dealer/")) {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

