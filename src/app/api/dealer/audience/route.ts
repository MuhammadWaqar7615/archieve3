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

    const dealerId = session?.dealerContext?.dealerId || 106;

    return NextResponse.json({
      allUsers: 1,
      registeredDevices: 0,
      androidDevices: 0,
      iosDevices: 0,
      languages: {
        th: 0,
        en: 0,
        zh: 0,
      },
      makeFollowers: 0,
      modelFollowers: 0,
      dealerId: typeof dealerId === "string" ? parseInt(dealerId, 10) || 106 : dealerId,
      appId: 1,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch dealer audience." },
      { status: 500 }
    );
  }
}
