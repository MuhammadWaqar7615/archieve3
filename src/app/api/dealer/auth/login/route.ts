import { NextResponse } from "next/server";
import { setSession, SessionData } from "@/lib/server/session";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const submittedUsername = String(body?.username || "").trim();
    const password = String(body?.password || "");

    if (!submittedUsername || !password) {
      return NextResponse.json(
        { success: false, message: "Username and password are required." },
        { status: 400 }
      );
    }

    const centralBaseUrl = (
      process.env.WOWCAR_WORDPRESS_URL || "https://staging.wowcar.co.th/wp-json"
    ).replace(/\/+$/, "");
    const centralAppKey = process.env.BENZ_RAJCHAKRU_APP_KEY || "";

    // Step 1: Authenticate against Central v0.2.1
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
      console.error("[Dealer Auth] Central login failed:", centralRes.status);
      return NextResponse.json(
        { success: false, message: "Invalid dealer credentials." },
        { status: 401 }
      );
    }

    const centralData = await centralRes.json();
    if (centralData?.success === false || !centralData?.tokens?.accessToken) {
      console.error("[Dealer Auth] Central tokens missing:", centralData);
      return NextResponse.json(
        { success: false, message: "Invalid dealer credentials." },
        { status: 401 }
      );
    }

    const dealerAccessToken: string = centralData.tokens.accessToken;
    const dealerRefreshToken: string = centralData.tokens.refreshToken || "";

    // Step 2: Verify Dealer authorization via /wowcar/v2/dealer/me
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
      console.error("[Dealer Auth] /dealer/me failed:", meRes.status);
      return NextResponse.json(
        { success: false, message: "Dealer account verification failed." },
        { status: 401 }
      );
    }

    const meData = await meRes.json();
    if (meData?.success === false) {
      console.error("[Dealer Auth] /dealer/me returned success:false");
      return NextResponse.json(
        { success: false, message: "Dealer account verification failed." },
        { status: 401 }
      );
    }

    // Step 3: Build dealer context
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

    const dealerContext = { dealerId, dealerName, appId, role };

    // Step 4: Write Dealer session
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
      redirectTo: "/dealer",
      user: {
        username: returnedUsername,
        displayName: userDisplayName,
      },
      dealer: dealerContext,
    });
  } catch (error: any) {
    console.error("[Dealer Auth] Unexpected error:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
