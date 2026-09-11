import { NextResponse } from "next/server";
import { getSession } from "@/lib/server/session";

export async function GET(request: Request) {
  try {
    const session = await getSession();

    const isDealer =
      session?.portal === "dealer" &&
      !!session?.dealerAccessToken &&
      !!session?.dealerContext?.dealerId;

    if (!isDealer) {
      return NextResponse.json(
        { error: "Forbidden", message: "Dealer session required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") || "5";

    const centralBaseUrl = (
      process.env.WOWCAR_WORDPRESS_URL || "https://staging.wowcar.co.th/wp-json"
    ).replace(/\/+$/, "");
    const centralAppKey = process.env.BENZ_RAJCHAKRU_APP_KEY || "";

    const centralUrl = `${centralBaseUrl}/wowcar/v2/dealer/notifications/recent?limit=${limit}`;
    const centralRes = await fetch(centralUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${session.dealerAccessToken}`,
        "X-WowCar-App-Key": centralAppKey,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!centralRes.ok) {
      return NextResponse.json([], { status: centralRes.status });
    }

    const data = await centralRes.json();
    const list = Array.isArray(data) ? data : Array.isArray(data?.notifications) ? data.notifications : [];
    
    return NextResponse.json(list);
  } catch (error: any) {
    return NextResponse.json([], { status: 500 });
  }
}
