import { NextResponse } from "next/server";
import { getSession } from "@/lib/server/session";
import { wordpressAdminGet, WordPressApiError } from "@/lib/server/wordpress";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    const isDealer =
      !!session?.dealerAccessToken &&
      !!session?.dealerContext?.dealerId;

    if (isDealer) {
      const centralBaseUrl = (
        process.env.WOWCAR_WORDPRESS_URL || "https://staging.wowcar.co.th/wp-json"
      ).replace(/\/+$/, "");
      const centralAppKey = process.env.BENZ_RAJCHAKRU_APP_KEY || "";

      const query = search ? `?search=${encodeURIComponent(search)}` : "";
      const centralUsersUrl = `${centralBaseUrl}/wowcar/v2/dealer/customers${query}`;
      const centralRes = await fetch(centralUsersUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.dealerAccessToken}`,
          "X-WowCar-App-Key": centralAppKey,
          Accept: "application/json",
        },
        cache: "no-store",
      });

      if (!centralRes.ok) {
        return NextResponse.json(
          { error: `Central dealer users API failed with status ${centralRes.status}` },
          { status: centralRes.status }
        );
      }

      const centralData = await centralRes.json();
      const rawUsers = Array.isArray(centralData)
        ? centralData
        : Array.isArray(centralData?.customers)
        ? centralData.customers
        : Array.isArray(centralData?.data)
        ? centralData.data
        : Array.isArray(centralData?.users)
        ? centralData.users
        : [];

      const mappedUsers = rawUsers.map((item: any) => ({
        wpUserId: String(item.wpUserId || item.id || item.user_id || item.ID || ""),
        name: item.name || item.displayName || item.display_name || item.first_name || item.email || "Customer",
        email: item.email || "",
        language: item.language || "en",
        platform: item.platform || "Web",
        registeredDevices: item.registeredDevices ?? item.devices ?? 1,
        pushEnabled: item.pushEnabled !== undefined ? Boolean(item.pushEnabled) : item.status ? item.status === "active" : true,
        lastSeen: item.lastSeen || item.last_active || item.created || item.registered || "Recently",
        priceDropAlerts: item.priceDropAlerts !== undefined ? Boolean(item.priceDropAlerts) : true,
        newArrivalAlerts: item.newArrivalAlerts !== undefined ? Boolean(item.newArrivalAlerts) : true,
        oneSignalExternalId: item.oneSignalExternalId || item.one_signal_id || "",
      }));

      return NextResponse.json(mappedUsers);
    }

    // Super Admin fallback
    const endpoint = search
      ? `/wowcar-admin/v1/users?search=${encodeURIComponent(search)}`
      : "/wowcar-admin/v1/users";
    const data = await wordpressAdminGet(endpoint);
    return NextResponse.json(data);
  } catch (error: any) {
    const status = error instanceof WordPressApiError ? error.status : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

