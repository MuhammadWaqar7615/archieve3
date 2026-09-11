import { NextResponse } from "next/server";
import { getSession } from "@/lib/server/session";

export async function GET() {
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

    const centralBaseUrl = (
      process.env.WOWCAR_WORDPRESS_URL || "https://staging.wowcar.co.th/wp-json"
    ).replace(/\/+$/, "");
    const centralAppKey = process.env.BENZ_RAJCHAKRU_APP_KEY || "";

    const centralNotifsUrl = `${centralBaseUrl}/wowcar/v2/dealer/notifications`;
    const centralRes = await fetch(centralNotifsUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${session.dealerAccessToken}`,
        "X-WowCar-App-Key": centralAppKey,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!centralRes.ok) {
      return NextResponse.json(fallbackNotifications);
    }

    const data = await centralRes.json();
    const list = Array.isArray(data) ? data : Array.isArray(data?.notifications) ? data.notifications : [];

    if (list.length === 0) {
      return NextResponse.json(fallbackNotifications);
    }

    return NextResponse.json(list);
  } catch (error: any) {
    return NextResponse.json(fallbackNotifications);
  }
}

const fallbackNotifications = [
  {
    id: "demo-1",
    title: "Welcome to WOWCAR",
    message: "This is a sample push notification.",
    audience: "All Users",
    status: "sent",
    createdAt: "2026-09-11T04:30:00+05:00",
  },
];
