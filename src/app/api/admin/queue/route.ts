import { NextResponse } from "next/server";
import { wordpressAdminGet, WordPressApiError } from "@/lib/server/wordpress";

export async function GET() {
  try {
    const data = await wordpressAdminGet("/wowcar-admin/v1/queue");
    return NextResponse.json(data);
  } catch (error: any) {
    const status = error instanceof WordPressApiError ? error.status : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
