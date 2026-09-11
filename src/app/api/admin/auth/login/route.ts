import { NextResponse } from "next/server";
import { setSession, SessionData } from "@/lib/server/session";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const submittedUsername = String(body?.username || "").trim();
    const password = String(body?.password || "");

    if (!submittedUsername || !password) {
      return NextResponse.json(
        { success: false, message: "Username and password are required." },
        { status: 400 }
      );
    }

    const wpBaseUrl = (
      process.env.WOWCAR_WORDPRESS_URL || "https://staging.wowcar.co.th/wp-json"
    ).replace(/\/+$/, "");

    const fetchOptions: RequestInit = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
      },
      body: JSON.stringify({ username: submittedUsername, password }),
      cache: "no-store",
      next: { revalidate: 0 },
    };

    let loginUrl = `${wpBaseUrl}/wowcar-admin/v1/login`;
    let wpRes = await fetch(loginUrl, fetchOptions);

    if (!wpRes.ok && wpRes.status === 404) {
      loginUrl = `${wpBaseUrl}/listivo/v1/login/`;
      wpRes = await fetch(loginUrl, fetchOptions);
    }

    const contentType = wpRes.headers.get("content-type") || "";
    if (!contentType.toLowerCase().includes("application/json")) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Server API returned HTML instead of JSON. A cache or maintenance layer may have intercepted the REST request.",
        },
        { status: 502 }
      );
    }

    if (!wpRes.ok) {
      return NextResponse.json(
        { success: false, message: "Invalid administrator credentials or insufficient permissions." },
        { status: 401 }
      );
    }

    const data = await wpRes.json();

    if (data?.success === false) {
      return NextResponse.json(
        { success: false, message: "Invalid administrator credentials or insufficient permissions." },
        { status: 401 }
      );
    }

    const portalToken =
      data?.token ||
      data?.portalToken ||
      data?.data?.token ||
      data?.accessToken ||
      data?.data?.accessToken ||
      data?.jwt ||
      data?.data?.jwt;

    if (!portalToken) {
      return NextResponse.json(
        {
          success: false,
          message: "Administrator login succeeded but no portal token was returned.",
        },
        { status: 502 }
      );
    }

    const returnedUsername =
      data?.user?.username ||
      data?.user?.name ||
      data?.data?.user?.username ||
      submittedUsername;

    const submittedNormalized = submittedUsername.toLowerCase();
    const returnedNormalized = String(returnedUsername).trim().toLowerCase();

    if (returnedNormalized !== submittedNormalized) {
      return NextResponse.json(
        { success: false, message: "Invalid administrator credentials or insufficient permissions." },
        { status: 401 }
      );
    }

    const rawRoles =
      data?.user?.role ??
      data?.user?.roles ??
      data?.data?.user?.role ??
      data?.data?.user?.roles ??
      [];

    const roles = Array.isArray(rawRoles) ? rawRoles : rawRoles ? [rawRoles] : [];

    if (roles.length > 0 && !roles.includes("administrator")) {
      return NextResponse.json(
        { success: false, message: "Invalid administrator credentials or insufficient permissions." },
        { status: 401 }
      );
    }

    const userDisplayName =
      data?.user?.displayName ||
      data?.user?.display_name ||
      data?.user?.name ||
      returnedUsername;

    const sessionDataToSave: SessionData = {
      portal: "admin",
      portalToken,
      user: {
        username: returnedUsername,
        displayName: userDisplayName,
      },
    };

    await setSession(sessionDataToSave);

    return NextResponse.json({
      success: true,
      portal: "admin",
      redirectTo: "/admin",
      user: {
        username: returnedUsername,
        displayName: userDisplayName,
      },
    });
  } catch (error) {
    console.error("[Admin Auth] Unexpected error:", error);
    return NextResponse.json(
      { success: false, message: "Invalid administrator credentials or insufficient permissions." },
      { status: 401 }
    );
  }
}
