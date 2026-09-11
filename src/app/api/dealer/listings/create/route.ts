import { NextResponse } from "next/server";
import { getSession } from "@/lib/server/session";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    
    const isDealer =
      session?.portal === "dealer" &&
      !!session?.dealerAccessToken &&
      !!session?.dealerContext?.dealerId;

    if (!isDealer) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Dealer session required." },
        { status: 401 }
      );
    }

    const formData = await request.formData();

    const centralBaseUrl = (
      process.env.WOWCAR_WORDPRESS_URL || "https://staging.wowcar.co.th/wp-json"
    ).replace(/\/+$/, "");
    const centralAppKey = process.env.BENZ_RAJCHAKRU_APP_KEY || "";

    const centralCreateUrl = `${centralBaseUrl}/wowcar/v2/dealer/listings/create`;
    const centralRes = await fetch(centralCreateUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.dealerAccessToken}`,
        "X-WowCar-App-Key": centralAppKey,
        Accept: "application/json",
      },
      body: formData,
      cache: "no-store",
    });

    const contentType = centralRes.headers.get("content-type") || "";
    let centralData: any = null;
    if (contentType.toLowerCase().includes("application/json")) {
      try {
        centralData = await centralRes.json();
      } catch (_) {
        centralData = null;
      }
    }

    if (!centralRes.ok) {
      const errorMsg =
        centralData?.error ||
        centralData?.message ||
        `Central dealer create listing API failed with status ${centralRes.status}`;
      return NextResponse.json({ error: errorMsg }, { status: centralRes.status });
    }

    if (!centralData) {
      return NextResponse.json(
        { error: "Central dealer create listing API returned invalid response." },
        { status: 502 }
      );
    }

    return NextResponse.json(centralData);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create dealer listing." },
      { status: 500 }
    );
  }
}
