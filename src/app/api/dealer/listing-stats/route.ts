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
        { error: "Unauthorized", message: "Dealer session required." },
        { status: 401 }
      );
    }

    const centralBaseUrl = (
      process.env.WOWCAR_WORDPRESS_URL || "https://staging.wowcar.co.th/wp-json"
    ).replace(/\/+$/, "");
    const centralAppKey = process.env.BENZ_RAJCHAKRU_APP_KEY || "";

    const headers = {
      Authorization: `Bearer ${session.dealerAccessToken}`,
      "X-WowCar-App-Key": centralAppKey,
      Accept: "application/json",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    };

    // Primary central dashboard endpoint
    let centralRes = await fetch(`${centralBaseUrl}/wowcar/v2/dealer/dashboard`, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    // Fallback if central dashboard endpoint is under listing-stats path
    if (!centralRes.ok) {
      centralRes = await fetch(`${centralBaseUrl}/wowcar/v2/dealer/listing-stats`, {
        method: "GET",
        headers,
        cache: "no-store",
      });
    }

    if (!centralRes.ok) {
      return NextResponse.json(
        { error: `Central dealer stats request failed with status ${centralRes.status}` },
        { status: centralRes.status }
      );
    }

    const centralData = await centralRes.json();
    const rawData =
      centralData?.listings ||
      centralData?.data?.listings ||
      centralData?.stats ||
      centralData?.listingStats ||
      centralData?.listing_stats ||
      centralData?.data?.stats ||
      centralData?.data ||
      centralData;

    const stats = {
      total: Number(rawData.total ?? rawData.total_listings ?? rawData.totalListings ?? 0),
      published: Number(rawData.published ?? rawData.published_listings ?? rawData.publishedListings ?? 0),
      draft: Number(rawData.draft ?? rawData.draft_listings ?? rawData.draftListings ?? 0),
      pending: Number(rawData.pending ?? rawData.pending_listings ?? rawData.pendingListings ?? 0),
      trash: Number(rawData.trash ?? rawData.trash_listings ?? rawData.trashListings ?? 0),
      featured: Number(rawData.featured ?? rawData.featured_listings ?? rawData.featuredListings ?? 0),
      last7Days: Number(rawData.last7Days ?? rawData.last_7_days ?? rawData.recent_7_days ?? 0),
      last30Days: Number(rawData.last30Days ?? rawData.last_30_days ?? rawData.recent_30_days ?? 0),
    };

    return NextResponse.json(stats);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch dealer listing stats." },
      { status: 500 }
    );
  }
}
