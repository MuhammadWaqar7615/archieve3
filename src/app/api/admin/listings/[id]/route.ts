import { NextResponse } from "next/server";
import { getSession } from "@/lib/server/session";
import { wordpressAdminGet, WordPressApiError } from "@/lib/server/wordpress";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    const resolvedParams = await params;
    const { searchParams } = new URL(request.url);
    const rawLang = (searchParams.get("lang") || "english").toLowerCase();
    const allowedLangs: Record<string, string> = {
      en: "english",
      th: "thai",
      zh: "chinese",
      english: "english",
      thai: "thai",
      chinese: "chinese",
    };
    const lang = allowedLangs[rawLang] || "english";

    // Super Admin / Non-dealer fallback
    const data = await wordpressAdminGet(
      `/listivo/v1/single-listing/${resolvedParams.id}?lang=${lang}`
    );
    return NextResponse.json(data);
  } catch (error: any) {
    const status = error instanceof WordPressApiError ? error.status : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

