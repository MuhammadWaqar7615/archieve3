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

    const data = await wordpressAdminGet("/wowcar-admin/v1/health");
    return NextResponse.json(data);
  } catch (error: any) {
    const status = error instanceof WordPressApiError ? error.status : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
