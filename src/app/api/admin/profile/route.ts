import { NextResponse } from "next/server";
import { getSession } from "@/lib/server/session";
import { wordpressAdminGet, wordpressAdminPost, WordPressApiError } from "@/lib/server/wordpress";

export async function GET() {
  try {
    const session = await getSession();

    const isAdmin = session?.portal === "admin" && !!session?.portalToken;

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Forbidden", message: "Access denied. Super Admin session required." },
        { status: 403 }
      );
    }

    // Super Admin legacy / global profile API
    const wpResponse: any = await wordpressAdminGet("/wowcar/v1/profile");
    return NextResponse.json(wpResponse);
  } catch (error: any) {
    const status = error instanceof WordPressApiError ? error.status : 500;
    return NextResponse.json(
      { error: error.message || "Failed to fetch user profile." },
      { status }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();

    const isAdmin = session?.portal === "admin" && !!session?.portalToken;

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Forbidden", message: "Access denied. Super Admin session required." },
        { status: 403 }
      );
    }

    // Super Admin legacy / global update profile API
    const body = await request.json();
    const wpResponse: any = await wordpressAdminPost("/wowcar/v1/update-profile", body);
    return NextResponse.json(wpResponse);
  } catch (error: any) {
    const status = error instanceof WordPressApiError ? error.status : 500;
    return NextResponse.json(
      { error: error.message || "Failed to update profile." },
      { status }
    );
  }
}
