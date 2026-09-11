import { NextResponse } from "next/server";
import { getSession } from "@/lib/server/session";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    const resolvedParams = await params;

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

    const centralTrashUrl = `${centralBaseUrl}/wowcar/v2/dealer/listings/${encodeURIComponent(resolvedParams.id)}/trash`;
    const centralRes = await fetch(centralTrashUrl, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${session.dealerAccessToken}`,
        "X-WowCar-App-Key": centralAppKey,
        Accept: "application/json",
      },
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
        `Central dealer trash listing API failed with status ${centralRes.status}`;
      return NextResponse.json({ error: errorMsg }, { status: centralRes.status });
    }

    return NextResponse.json(centralData || { success: true }, { status: centralRes.status });
  } catch (error: any) {
    const status = 500;
    return NextResponse.json({ error: error.message || "Failed to trash listing" }, { status });
  }
}
