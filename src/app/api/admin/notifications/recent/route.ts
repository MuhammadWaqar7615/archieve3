import { NextResponse } from "next/server";
import { wordpressAdminGet, WordPressApiError } from "@/lib/server/wordpress";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") || "5";
    const data = await wordpressAdminGet(`/wowcar-admin/v1/notifications/recent?limit=${limit}`);
    return NextResponse.json(data);
  } catch (error: any) {
    const status = error instanceof WordPressApiError ? error.status : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
