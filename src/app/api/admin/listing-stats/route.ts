import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/server/authGuard";
import { wordpressAdminGet, WordPressApiError } from "@/lib/server/wordpress";

export async function GET() {
  try {
    const session = await requireAdminSession();
    if (!session) {
      return NextResponse.json(
        { error: "Forbidden", message: "Super Admin session required." },
        { status: 403 }
      );
    }

    const wpResponse: any = await wordpressAdminGet("/wowcar/v1/listing-stats");
    const rawData = wpResponse?.data || wpResponse || {};

    const stats = {
      total: Number(rawData.total || 0),
      published: Number(rawData.published || 0),
      draft: Number(rawData.draft || 0),
      pending: Number(rawData.pending || 0),
      trash: Number(rawData.trash || 0),
      featured: Number(rawData.featured || 0),
      last7Days: Number(rawData.last7Days || 0),
      last30Days: Number(rawData.last30Days || 0),
    };

    return NextResponse.json(stats);
  } catch (error: any) {
    const status = error instanceof WordPressApiError ? error.status : 500;
    return NextResponse.json({ error: error.message || "Failed to fetch listing statistics." }, { status });
  }
}
