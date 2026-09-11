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
        { error: "Unauthorized", message: "Dealer session required." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const params = new URLSearchParams();

    const page = searchParams.get("page");
    const perPage = searchParams.get("per_page") || searchParams.get("perPage");
    const lang = searchParams.get("lang");
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const make = searchParams.get("make");

    if (page) params.set("page", page);
    if (perPage) params.set("per_page", perPage);
    if (lang) params.set("lang", lang);
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    if (make && make !== "all") params.set("make", make);

    const queryString = params.toString() ? `?${params.toString()}` : "";
    const centralBaseUrl = (
      process.env.WOWCAR_WORDPRESS_URL || "https://staging.wowcar.co.th/wp-json"
    ).replace(/\/+$/, "");
    const centralAppKey = process.env.BENZ_RAJCHAKRU_APP_KEY || "";

    const centralListingsUrl = `${centralBaseUrl}/wowcar/v2/dealer/listings${queryString}`;
    const centralRes = await fetch(centralListingsUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${session.dealerAccessToken}`,
        "X-WowCar-App-Key": centralAppKey,
        Accept: "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
      cache: "no-store",
    });

    if (!centralRes.ok) {
      return NextResponse.json(
        { error: `Central dealer listings request failed with status ${centralRes.status}` },
        { status: centralRes.status }
      );
    }

    const centralData = await centralRes.json();
    return NextResponse.json(centralData);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch dealer listings." },
      { status: 500 }
    );
  }
}
