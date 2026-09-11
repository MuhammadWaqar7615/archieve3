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
        { error: "Forbidden", message: "Dealer session required." },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Normal form validation
    if (!body?.title && !body?.translations) {
      return NextResponse.json(
        { error: "Validation error", message: "Notification title and message are required." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      demo: true,
      message: "Notification queued successfully in demo mode.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to process send request." },
      { status: 500 }
    );
  }
}
