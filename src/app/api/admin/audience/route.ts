import { NextResponse } from "next/server";
import { wordpressAdminGet, WordPressApiError } from "@/lib/server/wordpress";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    const endpoint = `/wowcar-admin/v1/audience${queryString ? `?${queryString}` : ""}`;
    const data = await wordpressAdminGet(endpoint);
    return NextResponse.json(data);
  } catch (error: any) {
    const status = error instanceof WordPressApiError ? error.status : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
