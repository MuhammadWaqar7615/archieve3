import { NextResponse } from "next/server";
import { getSession } from "@/lib/server/session";
import { wordpressAdminGet } from "@/lib/server/wordpress";

export async function GET() {
  const session = await getSession();

  if (!session?.user || !session?.portal) {
    return NextResponse.json({ authenticated: false });
  }

  // =========================================================
  // DEALER SESSION VALIDATION (Central v0.2.1 /dealer/me)
  // =========================================================
  if (session.portal === "dealer") {
    if (!session.dealerAccessToken || !session.dealerContext?.dealerId) {
      return NextResponse.json({ authenticated: false });
    }

    const dealerPayload = {
      authenticated: true,
      portal: "dealer",
      user: session.user,
      dealer: session.dealerContext,
    };

    const centralBaseUrl = (
      process.env.WOWCAR_WORDPRESS_URL || "https://staging.wowcar.co.th/wp-json"
    ).replace(/\/+$/, "");
    const centralAppKey = process.env.BENZ_RAJCHAKRU_APP_KEY || "";

    const meUrl = `${centralBaseUrl}/wowcar/v2/dealer/me`;
    try {
      const meRes = await fetch(meUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.dealerAccessToken}`,
          "X-WowCar-App-Key": centralAppKey,
          Accept: "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
        cache: "no-store",
      });

      if (!meRes.ok && (meRes.status === 401 || meRes.status === 403)) {
        return NextResponse.json({ authenticated: false });
      }

      const meData = await meRes.json();
      if (meData?.success === false) {
        return NextResponse.json({ authenticated: false });
      }

      return NextResponse.json(dealerPayload);
    } catch (err) {
      // If central endpoint is temporarily unreachable, trust valid encrypted session
      return NextResponse.json(dealerPayload);
    }
  }

  // =========================================================
  // SUPER ADMIN SESSION VALIDATION
  // =========================================================
  if (session.portal === "admin") {
    if (!session.portalToken) {
      return NextResponse.json({ authenticated: false });
    }

    const adminPayload = {
      authenticated: true,
      portal: "admin",
      user: session.user,
    };

    try {
      await wordpressAdminGet("/wowcar-admin/v1/session");
      return NextResponse.json(adminPayload);
    } catch (err: any) {
      if (err?.status === 401 || err?.status === 403) {
        return NextResponse.json({ authenticated: false });
      }
      return NextResponse.json(adminPayload);
    }
  }

  return NextResponse.json({ authenticated: false });
}

