import { NextResponse } from "next/server";
import { getSession } from "@/lib/server/session";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    const resolvedParams = await params;
    const contentType = request.headers.get("content-type") || "";
    const isMultipart = contentType.toLowerCase().includes("multipart/form-data");

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

    const centralUpdateUrl = `${centralBaseUrl}/wowcar/v2/dealer/listings/${encodeURIComponent(resolvedParams.id)}/update`;

    let fetchHeaders: Record<string, string> = {
      Authorization: `Bearer ${session.dealerAccessToken}`,
      "X-WowCar-App-Key": centralAppKey,
      Accept: "application/json",
    };

    let fetchBody: any;

    if (isMultipart) {
      fetchBody = await request.formData();
    } else {
      fetchHeaders["Content-Type"] = "application/json";
      fetchBody = JSON.stringify(await request.json());
    }

    const centralRes = await fetch(centralUpdateUrl, {
      method: "POST",
      headers: fetchHeaders,
      body: fetchBody,
      cache: "no-store",
    });

    const resContentType = centralRes.headers.get("content-type") || "";
    let centralData: any = null;
    if (resContentType.toLowerCase().includes("application/json")) {
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
        `Central dealer update listing API failed with status ${centralRes.status}`;
      return NextResponse.json({ error: errorMsg }, { status: centralRes.status });
    }

    if (!centralData) {
      return NextResponse.json(
        { error: "Central dealer update listing API returned invalid response." },
        { status: 502 }
      );
    }

    return NextResponse.json(centralData);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update dealer listing." },
      { status: 500 }
    );
  }
}
