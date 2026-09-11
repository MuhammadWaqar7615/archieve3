import { NextResponse } from "next/server";
import { setSession, SessionData } from "@/lib/server/session";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawUsername = body?.username || "";
    const password = body?.password || "";
    const portal = body?.portal;

    const submittedUsername = rawUsername.trim();

    if (!submittedUsername || !password) {
      return NextResponse.json(
        { success: false, message: "Invalid administrator credentials or insufficient permissions." },
        { status: 400 }
      );
    }

    if (portal !== "dealer" && portal !== "admin") {
      return NextResponse.json(
        { success: false, message: "Invalid portal login type." },
        { status: 400 }
      );
    }

    // =========================================================
    // 1. DEALER AUTHENTICATION (Central v0.2.1 Only)
    // =========================================================
    if (portal === "dealer") {
      const centralBaseUrl = (
        process.env.WOWCAR_WORDPRESS_URL || "https://staging.wowcar.co.th/wp-json"
      ).replace(/\/+$/, "");
      const centralAppKey = process.env.BENZ_RAJCHAKRU_APP_KEY || "";

      // Central v0.2.1 Auth Login Request
      const centralLoginUrl = `${centralBaseUrl}/wowcar/v2/auth/login`;
      const centralRes = await fetch(centralLoginUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-WowCar-App-Key": centralAppKey,
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
        body: JSON.stringify({ username: submittedUsername, password }),
        cache: "no-store",
      });

      if (!centralRes.ok) {
        console.error("[Central Auth Login Failed]", centralRes.status);
        return NextResponse.json(
          { success: false, message: "Invalid administrator credentials or insufficient permissions." },
          { status: 401 }
        );
      }

      const centralData = await centralRes.json();
      if (centralData?.success === false || !centralData?.tokens?.accessToken) {
        console.error("[Central Auth Tokens Missing]", centralData);
        return NextResponse.json(
          { success: false, message: "Invalid administrator credentials or insufficient permissions." },
          { status: 401 }
        );
      }

      const dealerAccessToken = centralData.tokens.accessToken;
      const dealerRefreshToken = centralData.tokens.refreshToken || "";

      // Verify Dealer Authorization via GET /wowcar/v2/dealer/me
      const meUrl = `${centralBaseUrl}/wowcar/v2/dealer/me`;
      const meRes = await fetch(meUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${dealerAccessToken}`,
          "X-WowCar-App-Key": centralAppKey,
          Accept: "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
        cache: "no-store",
      });

      if (!meRes.ok) {
        console.error("[Central Dealer /me Failed]", meRes.status);
        return NextResponse.json(
          { success: false, message: "Invalid administrator credentials or insufficient permissions." },
          { status: 401 }
        );
      }

      const meData = await meRes.json();
      if (meData?.success === false) {
        console.error("[Central Dealer /me Unsuccessful]", meData);
        return NextResponse.json(
          { success: false, message: "Invalid administrator credentials or insufficient permissions." },
          { status: 401 }
        );
      }

      const dealerId = Number(
        meData?.context?.dealerId || meData?.dealer?.id || centralData?.context?.dealerId || 106
      );
      const dealerName =
        meData?.context?.dealerName || meData?.dealer?.name || "Benz Rajchakru";
      const appId = Number(
        meData?.context?.appId || centralData?.context?.appId || 1
      );
      const role =
        meData?.context?.role || centralData?.context?.role || "owner";

      const returnedUsername =
        centralData?.user?.username || meData?.user?.username || submittedUsername;
      const userDisplayName =
        centralData?.user?.displayName || meData?.user?.displayName || dealerName;

      const dealerContext = {
        dealerId,
        dealerName,
        appId,
        role,
      };

      const sessionDataToSave: SessionData = {
        portal: "dealer",
        user: {
          username: returnedUsername,
          displayName: userDisplayName,
        },
        dealerAccessToken,
        dealerRefreshToken,
        dealerContext,
      };

      await setSession(sessionDataToSave);

      return NextResponse.json({
        success: true,
        portal: "dealer",
        user: {
          username: returnedUsername,
          displayName: userDisplayName,
        },
        dealer: dealerContext,
      });
    }

    // =========================================================
    // 2. SUPER ADMIN AUTHENTICATION (Portal === "admin")
    // =========================================================
    if (portal === "admin") {
      const wpBaseUrl = (
        process.env.WOWCAR_WORDPRESS_URL || "https://staging.wowcar.co.th/wp-json"
      ).replace(/\/+$/, "");

      const fetchOptions: RequestInit = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
        },
        body: JSON.stringify({ username: submittedUsername, password }),
        cache: "no-store",
        next: { revalidate: 0 },
      };

      let loginUrl = `${wpBaseUrl}/wowcar-admin/v1/login`;
      let wpRes = await fetch(loginUrl, fetchOptions);

      if (!wpRes.ok && wpRes.status === 404) {
        loginUrl = `${wpBaseUrl}/listivo/v1/login/`;
        wpRes = await fetch(loginUrl, fetchOptions);
      }

      const contentType = wpRes.headers.get("content-type") || "";
      if (!contentType.toLowerCase().includes("application/json")) {
        return NextResponse.json(
          { success: false, message: "Server API returned HTML instead of JSON. A cache or maintenance layer may have intercepted the REST request." },
          { status: 502 }
        );
      }

      if (!wpRes.ok) {
        return NextResponse.json(
          { success: false, message: "Invalid administrator credentials or insufficient permissions." },
          { status: 401 }
        );
      }

      const data = await wpRes.json();

      if (data?.success === false) {
        return NextResponse.json(
          { success: false, message: "Invalid administrator credentials or insufficient permissions." },
          { status: 401 }
        );
      }

      const portalToken =
        data?.token ||
        data?.portalToken ||
        data?.data?.token ||
        data?.accessToken ||
        data?.data?.accessToken ||
        data?.jwt ||
        data?.data?.jwt;

      if (!portalToken) {
        return NextResponse.json(
          {
            success: false,
            message: "Administrator login succeeded but no portal token was returned."
          },
          { status: 502 }
        );
      }

      const returnedUsername =
        data?.user?.username ||
        data?.user?.name ||
        data?.data?.user?.username ||
        submittedUsername;

      const submittedNormalized = submittedUsername.toLowerCase();
      const returnedNormalized = String(returnedUsername).trim().toLowerCase();

      if (returnedNormalized !== submittedNormalized) {
        return NextResponse.json(
          { success: false, message: "Invalid administrator credentials or insufficient permissions." },
          { status: 401 }
        );
      }

      const rawRoles =
        data?.user?.role ??
        data?.user?.roles ??
        data?.data?.user?.role ??
        data?.data?.user?.roles ??
        [];

      const roles = Array.isArray(rawRoles) ? rawRoles : rawRoles ? [rawRoles] : [];

      if (roles.length > 0 && !roles.includes("administrator")) {
        return NextResponse.json(
          { success: false, message: "Invalid administrator credentials or insufficient permissions." },
          { status: 401 }
        );
      }

      const userDisplayName =
        data?.user?.displayName ||
        data?.user?.display_name ||
        data?.user?.name ||
        returnedUsername;

      const sessionDataToSave: SessionData = {
        portal: "admin",
        portalToken,
        user: {
          username: returnedUsername,
          displayName: userDisplayName,
        },
      };

      await setSession(sessionDataToSave);

      return NextResponse.json({
        success: true,
        portal: "admin",
        user: {
          username: returnedUsername,
          displayName: userDisplayName,
        },
      });
    }

    return NextResponse.json(
      { success: false, message: "Invalid portal login type." },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Invalid administrator credentials or insufficient permissions." },
      { status: 401 }
    );
  }
}
