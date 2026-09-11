import { NextResponse } from "next/server";
import { getSession } from "@/lib/server/session";
import { WordPressApiError } from "@/lib/server/wordpress";

export async function GET() {
  try {
    const session = await getSession();

    const isDealer =
      session?.portal === "dealer" &&
      !!session?.dealerAccessToken &&
      !!session?.dealerContext?.dealerId;

    if (!isDealer) {
      return NextResponse.json(
        { error: "Forbidden", message: "Access denied. Dealer session required." },
        { status: 403 }
      );
    }

    const centralBaseUrl = (
      process.env.WOWCAR_WORDPRESS_URL || "https://staging.wowcar.co.th/wp-json"
    ).replace(/\/+$/, "");
    const centralAppKey = process.env.BENZ_RAJCHAKRU_APP_KEY || "";

    const centralProfileUrl = `${centralBaseUrl}/wowcar/v2/dealer/profile`;
    const centralRes = await fetch(centralProfileUrl, {
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
        { error: `Central dealer profile API failed with status ${centralRes.status}` },
        { status: centralRes.status }
      );
    }

    const centralData = await centralRes.json();
    const rawProfile = centralData?.data || centralData?.profile || centralData?.dealer || centralData;
    const social = rawProfile?.social || {};

    const rawPhoneCode = String(
      rawProfile?.phone_country_code || rawProfile?.phoneCountryCode || rawProfile?.country_code || "+66"
    );
    const phoneCountryCode = rawPhoneCode.includes("+")
      ? `+${rawPhoneCode.split("+").pop()?.trim()}`
      : rawPhoneCode;

    const normalizedProfile = {
      ID: Number(rawProfile?.ID || rawProfile?.id || rawProfile?.dealer_id || session.dealerContext?.dealerId || 0),
      username: String(rawProfile?.username || rawProfile?.user_login || session.user?.username || "benzrajchakru"),
      email: String(rawProfile?.email || rawProfile?.user_email || (session.user as any)?.email || ""),
      display_name: String(rawProfile?.display_name || rawProfile?.displayName || rawProfile?.name || rawProfile?.title || "Benz Rajchakru"),
      first_name: String(rawProfile?.first_name || rawProfile?.firstName || ""),
      last_name: String(rawProfile?.last_name || rawProfile?.lastName || ""),
      phone_country_code: phoneCountryCode,
      phone: String(rawProfile?.phone || rawProfile?.telephone || rawProfile?.mobile || ""),
      address: String(rawProfile?.address || rawProfile?.location || ""),
      lat: String(rawProfile?.lat || rawProfile?.latitude || ""),
      lng: String(rawProfile?.lng || rawProfile?.longitude || ""),
      line_id: String(rawProfile?.line_id || rawProfile?.lineId || rawProfile?.line || ""),
      description: String(rawProfile?.description || rawProfile?.bio || rawProfile?.about || ""),
      image: Number(rawProfile?.image || rawProfile?.imageId || rawProfile?.attachment_id || rawProfile?.logo || 0),
      imageUrl: String(rawProfile?.imageUrl || rawProfile?.image_url || ""),
      facebook_profile: String(rawProfile?.facebook_profile || social?.facebook || rawProfile?.facebook || ""),
      instagram_profile: String(rawProfile?.instagram_profile || social?.instagram || rawProfile?.instagram || ""),
      you_tube_profile: String(rawProfile?.you_tube_profile || social?.youtube || rawProfile?.youtube || ""),
      linked_in_profile: String(rawProfile?.linked_in_profile || social?.linkedin || rawProfile?.linkedin || ""),
      twitter_profile: String(rawProfile?.twitter_profile || social?.twitter || rawProfile?.twitter || rawProfile?.x || ""),
      tiktok_profile: String(rawProfile?.tiktok_profile || social?.tiktok || rawProfile?.tiktok || ""),
    };

    return NextResponse.json({
      success: true,
      data: normalizedProfile,
    });
  } catch (error: any) {
    const status = error instanceof WordPressApiError ? error.status : 500;
    return NextResponse.json(
      { error: error.message || "Failed to fetch dealer profile." },
      { status }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();

    const isDealer =
      session?.portal === "dealer" &&
      !!session?.dealerAccessToken &&
      !!session?.dealerContext?.dealerId;

    if (!isDealer) {
      return NextResponse.json(
        { error: "Forbidden", message: "Access denied. Dealer session required." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const centralBaseUrl = (
      process.env.WOWCAR_WORDPRESS_URL || "https://staging.wowcar.co.th/wp-json"
    ).replace(/\/+$/, "");
    const centralAppKey = process.env.BENZ_RAJCHAKRU_APP_KEY || "";

    const centralPayload = {
      displayName: body.display_name,
      firstName: body.first_name,
      lastName: body.last_name,
      email: body.email,
      phoneCountryCode: body.phone_country_code,
      phone: body.phone,
      address: body.address,
      lat: body.lat,
      lng: body.lng,
      lineId: body.line_id,
      description: body.description,
      imageId: body.image,
      social: {
        facebook: body.facebook_profile,
        instagram: body.instagram_profile,
        youtube: body.you_tube_profile,
        linkedin: body.linked_in_profile,
        twitter: body.twitter_profile,
        tiktok: body.tiktok_profile,
      },
      ...body,
    };

    const centralProfileUrl = `${centralBaseUrl}/wowcar/v2/dealer/profile`;
    const centralRes = await fetch(centralProfileUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.dealerAccessToken}`,
        "X-WowCar-App-Key": centralAppKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(centralPayload),
      cache: "no-store",
    });

    if (!centralRes.ok) {
      return NextResponse.json(
        { error: `Central dealer update profile API failed with status ${centralRes.status}` },
        { status: centralRes.status }
      );
    }

    const centralData = await centralRes.json();
    const rawProfile = centralData?.data || centralData?.profile || centralData?.dealer || centralData;
    const social = rawProfile?.social || {};

    const rawPhoneCode = String(
      body.phone_country_code ?? rawProfile?.phone_country_code ?? rawProfile?.phoneCountryCode ?? "+66"
    );
    const phoneCountryCode = rawPhoneCode.includes("+")
      ? `+${rawPhoneCode.split("+").pop()?.trim()}`
      : rawPhoneCode;

    const normalizedProfile = {
      ID: Number(rawProfile?.ID || rawProfile?.id || rawProfile?.dealer_id || session.dealerContext?.dealerId || 0),
      username: String(rawProfile?.username || rawProfile?.user_login || session.user?.username || "benzrajchakru"),
      email: String(body.email ?? rawProfile?.email ?? (session.user as any)?.email ?? ""),
      display_name: String(body.display_name ?? rawProfile?.display_name ?? rawProfile?.displayName ?? "Benz Rajchakru"),
      first_name: String(body.first_name ?? rawProfile?.first_name ?? rawProfile?.firstName ?? ""),
      last_name: String(body.last_name ?? rawProfile?.last_name ?? rawProfile?.lastName ?? ""),
      phone_country_code: phoneCountryCode,
      phone: String(body.phone ?? rawProfile?.phone ?? ""),
      address: String(body.address ?? rawProfile?.address ?? ""),
      lat: String(body.lat ?? rawProfile?.lat ?? ""),
      lng: String(body.lng ?? rawProfile?.lng ?? ""),
      line_id: String(body.line_id ?? rawProfile?.line_id ?? rawProfile?.lineId ?? ""),
      description: String(body.description ?? rawProfile?.description ?? ""),
      image: Number(rawProfile?.image || rawProfile?.imageId || body.image || 0),
      imageUrl: String(rawProfile?.imageUrl || rawProfile?.image_url || ""),
      facebook_profile: String(body.facebook_profile ?? rawProfile?.facebook_profile ?? social?.facebook ?? ""),
      instagram_profile: String(body.instagram_profile ?? rawProfile?.instagram_profile ?? social?.instagram ?? ""),
      you_tube_profile: String(body.you_tube_profile ?? rawProfile?.you_tube_profile ?? social?.youtube ?? ""),
      linked_in_profile: String(body.linked_in_profile ?? rawProfile?.linked_in_profile ?? social?.linkedin ?? ""),
      twitter_profile: String(body.twitter_profile ?? rawProfile?.twitter_profile ?? social?.twitter ?? ""),
      tiktok_profile: String(body.tiktok_profile ?? rawProfile?.tiktok_profile ?? social?.tiktok ?? ""),
    };

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully.",
      data: normalizedProfile,
    });
  } catch (error: any) {
    const status = error instanceof WordPressApiError ? error.status : 500;
    return NextResponse.json(
      { error: error.message || "Failed to update dealer profile." },
      { status }
    );
  }
}
