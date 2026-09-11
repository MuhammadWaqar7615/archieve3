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
    const rawLang = (searchParams.get("lang") || "english").toLowerCase();
    const allowedLangs: Record<string, string> = {
      en: "english",
      th: "thai",
      zh: "chinese",
      english: "english",
      thai: "thai",
      chinese: "chinese",
    };
    const lang = allowedLangs[rawLang] || "english";

    const centralBaseUrl = (
      process.env.WOWCAR_WORDPRESS_URL || "https://staging.wowcar.co.th/wp-json"
    ).replace(/\/+$/, "");
    const centralAppKey = process.env.BENZ_RAJCHAKRU_APP_KEY || "";

    const centralDatasetUrl = `${centralBaseUrl}/wowcar/v2/dealer/listings/dataset?lang=${lang}`;
    const centralRes = await fetch(centralDatasetUrl, {
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
        { error: `Central dealer listing dataset API failed with status ${centralRes.status}` },
        { status: centralRes.status }
      );
    }

    const centralData = await centralRes.json();
    return NextResponse.json(centralData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch dataset" }, { status: 500 });
  }
}
